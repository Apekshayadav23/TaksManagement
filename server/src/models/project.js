import { DataTypes } from 'sequelize';

export default function ProjectModel(sequelize) {
  return sequelize.define(
    'Project',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(140),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 140],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'blue',
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'projects',
      indexes: [{ fields: ['ownerId'] }],
    },
  );
}
