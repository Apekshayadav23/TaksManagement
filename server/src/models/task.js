import { DataTypes } from 'sequelize';

export default function TaskModel(sequelize) {
  return sequelize.define(
    'Task',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(180),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 180],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('todo', 'in-progress', 'review', 'done'),
        allowNull: false,
        defaultValue: 'todo',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium',
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      assigneeId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      creatorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'tasks',
      indexes: [
        { fields: ['projectId'] },
        { fields: ['assigneeId'] },
        { fields: ['status'] },
      ],
    },
  );
}
