import { DataTypes } from 'sequelize';

export default function ProjectMemberModel(sequelize) {
  return sequelize.define(
    'ProjectMember',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'project_members',
      indexes: [{ fields: ['projectId', 'userId'], unique: true }],
    },
  );
}
