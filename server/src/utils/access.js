import { ProjectMember } from '../models/index.js';

export async function isProjectMember(projectId, userId) {
  const row = await ProjectMember.findOne({ where: { projectId, userId } });
  return Boolean(row);
}
