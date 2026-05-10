import { Op } from 'sequelize';
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authorize } from '../middleware/authorize.js';
import { User, Project, ProjectMember, Task } from '../models/index.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';
import { isProjectMember } from '../utils/access.js';

const router = Router();
router.use(authenticate);

async function findProjectForUser(projectId, user) {
  const project = await Project.findByPk(projectId);
  if (!project) throw notFound('Project not found');

  if (user.role === 'admin') return project;

  const member = await isProjectMember(project.id, user.id);
  if (!member) throw forbidden('You do not have access to this project');

  return project;
}

function validateProjectPayload(payload) {
  if (!payload.name || payload.name.trim().length < 2) {
    throw badRequest('Project name must be at least 2 characters');
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = req.user.role === 'admin' ? {} : { id: { [Op.in]: [] } };

    if (req.user.role !== 'admin') {
      const memberships = await ProjectMember.findAll({ where: { userId: req.user.id } });
      where.id = { [Op.in]: memberships.map((m) => m.projectId) };
    }

    const projects = await Project.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'role'],
          through: { attributes: [] },
        },
      ],
    });

    const taskCounts = await Task.findAll({
      attributes: ['projectId', 'status'],
      where: { projectId: projects.map((p) => p.id) },
      raw: true,
    });

    const statsByProject = taskCounts.reduce((acc, row) => {
      if (!acc[row.projectId]) {
        acc[row.projectId] = { totalTasks: 0, doneTasks: 0 };
      }
      acc[row.projectId].totalTasks += 1;
      if (row.status === 'done') acc[row.projectId].doneTasks += 1;
      return acc;
    }, {});

    const data = projects.map((project) => {
      const stats = statsByProject[project.id] || { totalTasks: 0, doneTasks: 0 };
      return {
        ...project.toJSON(),
        totalTasks: stats.totalTasks,
        doneTasks: stats.doneTasks,
      };
    });

    res.json({ projects: data });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await findProjectForUser(req.params.id, req.user);

    const fullProject = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'role'],
          through: { attributes: [] },
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'status'],
        },
      ],
    });

    if (!fullProject) throw notFound('Project not found');
    res.json({ project: fullProject });
  }),
);

router.post(
  '/',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { name, description, color, memberIds } = req.body ?? {};
    validateProjectPayload({ name });

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || null,
      color: color || 'blue',
      ownerId: req.user.id,
    });

    const uniqueMemberIds = Array.from(new Set([req.user.id, ...(Array.isArray(memberIds) ? memberIds : [])]));

    const users = await User.findAll({ where: { id: uniqueMemberIds } });
    if (users.length !== uniqueMemberIds.length) {
      throw badRequest('One or more members are invalid');
    }

    await ProjectMember.bulkCreate(uniqueMemberIds.map((userId) => ({ projectId: project.id, userId })));

    const createdProject = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'members', attributes: ['id', 'name', 'email', 'role'], through: { attributes: [] } }],
    });

    res.status(201).json({ project: createdProject });
  }),
);

router.patch(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) throw notFound('Project not found');

    const { name, description, color, memberIds } = req.body ?? {};
    if (name !== undefined && name.trim().length < 2) {
      throw badRequest('Project name must be at least 2 characters');
    }

    await project.update({
      name: name === undefined ? project.name : name.trim(),
      description: description === undefined ? project.description : description?.trim() || null,
      color: color || project.color,
    });

    if (Array.isArray(memberIds)) {
      const uniqueMemberIds = Array.from(new Set([project.ownerId, ...memberIds]));
      const users = await User.findAll({ where: { id: uniqueMemberIds } });
      if (users.length !== uniqueMemberIds.length) {
        throw badRequest('One or more members are invalid');
      }

      await ProjectMember.destroy({ where: { projectId: project.id } });
      await ProjectMember.bulkCreate(
        uniqueMemberIds.map((userId) => ({
          projectId: project.id,
          userId,
        })),
      );

      await Task.update(
        { assigneeId: null },
        {
          where: {
            projectId: project.id,
            assigneeId: { [Op.notIn]: uniqueMemberIds },
          },
        },
      );
    }

    const updatedProject = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'members', attributes: ['id', 'name', 'email', 'role'], through: { attributes: [] } }],
    });

    res.json({ project: updatedProject });
  }),
);

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) throw notFound('Project not found');

    await project.destroy();
    res.status(204).send();
  }),
);

router.post(
  '/:id/members',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) throw notFound('Project not found');

    const { userId } = req.body ?? {};
    if (!userId) throw badRequest('userId is required');

    const user = await User.findByPk(userId);
    if (!user) throw badRequest('User not found');

    await ProjectMember.findOrCreate({ where: { projectId: project.id, userId: user.id } });

    const members = await User.findAll({
      include: [
        {
          model: Project,
          as: 'memberProjects',
          where: { id: project.id },
          through: { attributes: [] },
          attributes: [],
        },
      ],
      attributes: ['id', 'name', 'email', 'role'],
    });

    res.status(201).json({ members });
  }),
);

router.delete(
  '/:id/members/:userId',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) throw notFound('Project not found');

    const membership = await ProjectMember.findOne({ where: { projectId: project.id, userId: req.params.userId } });
    if (!membership) throw notFound('Member not found in project');

    if (project.ownerId === req.params.userId) {
      throw badRequest('Project owner cannot be removed');
    }

    await membership.destroy();
    await Task.update(
      { assigneeId: null },
      {
        where: {
          projectId: project.id,
          assigneeId: req.params.userId,
        },
      },
    );

    res.status(204).send();
  }),
);

export default router;
