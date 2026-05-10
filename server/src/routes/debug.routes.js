import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { Task, User, Project } from '../models/index.js';

const router = Router();

router.get(
  '/tasks',
  asyncHandler(async (_req, res) => {
    const [tasks, users, projects] = await Promise.all([
      Task.findAll({ order: [['createdAt', 'DESC']] }),
      User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'createdAt'],
        order: [['createdAt', 'ASC']],
      }),
      Project.findAll({ order: [['createdAt', 'ASC']] }),
    ]);

    const payload = {
      counts: {
        tasks: tasks.length,
        users: users.length,
        projects: projects.length,
      },
      tasks,
      users,
      projects,
    };

    console.log('[DEBUG] /api/debug/tasks snapshot:');
    console.log(JSON.stringify(payload, null, 2));

    res.json(payload);
  }),
);

export default router;
