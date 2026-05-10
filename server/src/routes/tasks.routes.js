import { Op } from 'sequelize';
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { Project, ProjectMember, Task, User } from '../models/index.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';
import { isProjectMember } from '../utils/access.js';

const router = Router();
router.use(authenticate);

async function ensureProjectAccess(projectId, user) {
  const project = await Project.findByPk(projectId);
  if (!project) throw notFound('Project not found');

  if (user.role === 'admin') return project;

  const member = await isProjectMember(projectId, user.id);
  if (!member) throw forbidden('You do not have access to this project');

  return project;
}

async function ensureTaskAccess(taskId, user) {
  const task = await Task.findByPk(taskId, {
    include: [
      { model: Project, as: 'project' },
      { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] },
      { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
    ],
  });

  if (!task) throw notFound('Task not found');

  if (user.role === 'admin') return task;

  const member = await isProjectMember(task.projectId, user.id);
  if (!member) throw forbidden('You do not have access to this task');

  return task;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { projectId, status, priority, search, assignedToMe } = req.query;

    const where = {};

    if (projectId) where.projectId = projectId;
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (assignedToMe === 'true') {
      where.assigneeId = req.user.id;
    }

    if (req.user.role !== 'admin') {
      const memberships = await ProjectMember.findAll({ where: { userId: req.user.id } });
      const allowedProjectIds = memberships.map((m) => m.projectId);
      where.projectId = where.projectId
        ? where.projectId
        : { [Op.in]: allowedProjectIds.length ? allowedProjectIds : ['no-project'] };

      if (typeof where.projectId === 'string' && !allowedProjectIds.includes(where.projectId)) {
        throw forbidden('You do not have access to this project');
      }
    }

    const tasks = await Task.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    res.json({ tasks });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body ?? {};

    if (!title || title.trim().length < 2) {
      throw badRequest('Task title must be at least 2 characters');
    }

    if (!projectId) throw badRequest('projectId is required');

    await ensureProjectAccess(projectId, req.user);

    if (assigneeId) {
      const assignee = await User.findByPk(assigneeId);
      if (!assignee) throw badRequest('Assignee not found');

      const isMember = await isProjectMember(projectId, assigneeId);
      if (!isMember) {
        throw badRequest('Assignee must be a member of the selected project');
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || null,
      projectId,
      assigneeId: assigneeId || null,
      creatorId: req.user.id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });

    const createdTask = await Task.findByPk(task.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    res.status(201).json({ task: createdTask });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await ensureTaskAccess(req.params.id, req.user);

    const canModify = req.user.role === 'admin' || req.user.id === task.creatorId || req.user.id === task.assigneeId;
    if (!canModify) {
      throw forbidden('Only admin, creator, or assignee can update this task');
    }

    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body ?? {};

    if (title !== undefined && title.trim().length < 2) {
      throw badRequest('Task title must be at least 2 characters');
    }

    if (projectId && projectId !== task.projectId) {
      await ensureProjectAccess(projectId, req.user);
    }

    const nextProjectId = projectId || task.projectId;

    if (assigneeId !== undefined) {
      if (assigneeId !== null && assigneeId !== '') {
        const assignee = await User.findByPk(assigneeId);
        if (!assignee) throw badRequest('Assignee not found');
        const member = await isProjectMember(nextProjectId, assigneeId);
        if (!member) {
          throw badRequest('Assignee must be a member of the selected project');
        }
      }
    }

    await task.update({
      title: title === undefined ? task.title : title.trim(),
      description: description === undefined ? task.description : description?.trim() || null,
      projectId: projectId || task.projectId,
      assigneeId: assigneeId === undefined ? task.assigneeId : assigneeId || null,
      status: status || task.status,
      priority: priority || task.priority,
      dueDate: dueDate === undefined ? task.dueDate : dueDate || null,
    });

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    res.json({ task: updatedTask });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await ensureTaskAccess(req.params.id, req.user);

    const canDelete = req.user.role === 'admin' || req.user.id === task.creatorId;
    if (!canDelete) {
      throw forbidden('Only admin or creator can delete this task');
    }

    await task.destroy();
    res.status(204).send();
  }),
);

export default router;
