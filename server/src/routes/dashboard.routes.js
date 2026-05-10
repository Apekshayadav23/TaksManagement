import { Op } from 'sequelize';
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ProjectMember, Task } from '../models/index.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let where = {};

    if (req.user.role !== 'admin') {
      const memberships = await ProjectMember.findAll({ where: { userId: req.user.id }, raw: true });
      const projectIds = memberships.map((m) => m.projectId);
      where = {
        projectId: { [Op.in]: projectIds.length ? projectIds : ['no-project'] },
      };
    }

    const tasks = await Task.findAll({ where, raw: true });

    const now = new Date();
    const overdueCount = tasks.filter((task) => {
      if (!task.dueDate || task.status === 'done') return false;
      return new Date(task.dueDate) < now;
    }).length;

    const stats = {
      totalTasks: tasks.length,
      todoTasks: tasks.filter((task) => task.status === 'todo').length,
      inProgressTasks: tasks.filter((task) => task.status === 'in-progress').length,
      reviewTasks: tasks.filter((task) => task.status === 'review').length,
      doneTasks: tasks.filter((task) => task.status === 'done').length,
      overdueTasks: overdueCount,
    };

    const byStatus = [
      { status: 'todo', count: stats.todoTasks },
      { status: 'in-progress', count: stats.inProgressTasks },
      { status: 'review', count: stats.reviewTasks },
      { status: 'done', count: stats.doneTasks },
    ];

    res.json({ stats, byStatus });
  }),
);

export default router;
