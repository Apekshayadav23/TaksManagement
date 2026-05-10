import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import asyncHandler from '../utils/asyncHandler.js';
import { Project, ProjectMember, Task, User } from '../models/index.js';
import { badRequest, notFound } from '../utils/httpError.js';

const router = Router();
router.use(authenticate, authorize('admin'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'ASC']],
    });

    const memberRows = await ProjectMember.findAll({ attributes: ['userId'], raw: true });
    const taskRows = await Task.findAll({ attributes: ['assigneeId', 'status'], raw: true });

    const projectCountByUser = memberRows.reduce((acc, row) => {
      acc[row.userId] = (acc[row.userId] || 0) + 1;
      return acc;
    }, {});

    const taskStatsByUser = taskRows.reduce((acc, row) => {
      if (!row.assigneeId) return acc;
      if (!acc[row.assigneeId]) {
        acc[row.assigneeId] = { assignedTasks: 0, completedTasks: 0 };
      }
      acc[row.assigneeId].assignedTasks += 1;
      if (row.status === 'done') acc[row.assigneeId].completedTasks += 1;
      return acc;
    }, {});

    const enriched = users.map((user) => {
      const taskStats = taskStatsByUser[user.id] || { assignedTasks: 0, completedTasks: 0 };
      return {
        ...user.toJSON(),
        projectCount: projectCountByUser[user.id] || 0,
        assignedTasks: taskStats.assignedTasks,
        completedTasks: taskStats.completedTasks,
      };
    });

    res.json({ users: enriched });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body ?? {};

    if (!name || name.trim().length < 2) throw badRequest('Name must be at least 2 characters');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw badRequest('A valid email is required');
    if (!password || password.length < 6) throw badRequest('Password must be at least 6 characters');

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) throw badRequest('Email already exists');

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === 'admin' ? 'admin' : 'member',
    });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        projectCount: 0,
        assignedTasks: 0,
        completedTasks: 0,
        createdAt: user.createdAt,
      },
    });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) throw notFound('User not found');

    const { name, email, role } = req.body ?? {};

    if (name !== undefined && name.trim().length < 2) throw badRequest('Name must be at least 2 characters');
    if (email !== undefined && !/^\S+@\S+\.\S+$/.test(email)) throw badRequest('A valid email is required');

    if (email && email.trim().toLowerCase() !== user.email) {
      const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (existing) throw badRequest('Email already exists');
    }

    await user.update({
      name: name === undefined ? user.name : name.trim(),
      email: email === undefined ? user.email : email.trim().toLowerCase(),
      role: role === undefined ? user.role : role,
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.user.id === req.params.id) {
      throw badRequest('You cannot delete your own account');
    }

    const user = await User.findByPk(req.params.id);
    if (!user) throw notFound('User not found');

    await ProjectMember.destroy({ where: { userId: user.id } });
    await Task.update({ assigneeId: null }, { where: { assigneeId: user.id } });

    const ownedProjects = await Project.findAll({ where: { ownerId: user.id } });
    for (const project of ownedProjects) {
      await project.destroy();
    }

    await user.destroy();
    res.status(204).send();
  }),
);

export default router;
