import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import sequelize from '../config/db.js';
import UserModel from './user.js';
import ProjectModel from './project.js';
import ProjectMemberModel from './projectMember.js';
import TaskModel from './task.js';

export const User = UserModel(sequelize);
export const Project = ProjectModel(sequelize);
export const ProjectMember = ProjectMemberModel(sequelize);
export const Task = TaskModel(sequelize);

Project.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
User.hasMany(Project, { as: 'ownedProjects', foreignKey: 'ownerId' });

Project.belongsToMany(User, {
  through: ProjectMember,
  as: 'members',
  foreignKey: 'projectId',
  otherKey: 'userId',
});

User.belongsToMany(Project, {
  through: ProjectMember,
  as: 'memberProjects',
  foreignKey: 'userId',
  otherKey: 'projectId',
});

Task.belongsTo(Project, { as: 'project', foreignKey: 'projectId', onDelete: 'CASCADE' });
Project.hasMany(Task, { as: 'tasks', foreignKey: 'projectId' });

Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assigneeId' });

Task.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
User.hasMany(Task, { as: 'createdTasks', foreignKey: 'creatorId' });

const colorList = ['blue', 'green', 'teal', 'amber', 'coral'];

function randomColor() {
  return colorList[Math.floor(Math.random() * colorList.length)];
}

export async function seedDemoData() {
  const existingUsers = await User.count();
  if (existingUsers > 0) return;

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const memberPasswordHash = await bcrypt.hash('member123', 10);

  const admin = await User.create({
    name: 'Alex Morgan',
    email: 'admin@demo.com',
    passwordHash: adminPasswordHash,
    role: 'admin',
  });

  const member = await User.create({
    name: 'Sam Rivera',
    email: 'member@demo.com',
    passwordHash: memberPasswordHash,
    role: 'member',
  });

  const project = await Project.create({
    name: 'Website Redesign',
    description: 'Complete overhaul of company website',
    color: randomColor(),
    ownerId: admin.id,
  });

  await ProjectMember.bulkCreate([
    { projectId: project.id, userId: admin.id },
    { projectId: project.id, userId: member.id },
  ]);

  const today = new Date();
  const plus = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  await Task.bulkCreate([
    {
      title: 'Design mockups',
      description: 'Create wireframes for all major pages',
      projectId: project.id,
      assigneeId: member.id,
      creatorId: admin.id,
      status: 'in-progress',
      priority: 'high',
      dueDate: plus(3),
    },
    {
      title: 'Setup CI/CD pipeline',
      description: 'Configure deployment checks and build workflow',
      projectId: project.id,
      assigneeId: admin.id,
      creatorId: admin.id,
      status: 'todo',
      priority: 'medium',
      dueDate: plus(7),
    },
    {
      title: 'Write API tests',
      description: 'Add test coverage for task and auth endpoints',
      projectId: project.id,
      assigneeId: member.id,
      creatorId: admin.id,
      status: 'todo',
      priority: 'low',
      dueDate: plus(-2),
    },
  ]);
}

export async function initDatabase() {
  const dbPath = sequelize.options.storage;
  const dbDir = path.dirname(dbPath);
  fs.mkdirSync(dbDir, { recursive: true });
  await sequelize.authenticate();
  await sequelize.sync();
  await seedDemoData();
}
