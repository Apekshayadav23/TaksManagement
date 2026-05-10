import { useState } from 'react';
import { api } from '../api/client';
import { PROJECT_COLORS, PROJECT_COLOR_VALUES } from '../config/constants';
import { Avatar, Badge, Button, EmptyState, Field, Modal } from './common';

function ProjectForm({ allUsers, currentProject, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() => ({
    name: currentProject?.name || '',
    description: currentProject?.description || '',
    color: currentProject?.color || 'blue',
    memberIds: currentProject?.members?.map((member) => member.id) || [],
  }));
  const [error, setError] = useState('');

  function toggleMember(userId) {
    setForm((prev) => {
      const selected = prev.memberIds.includes(userId)
        ? prev.memberIds.filter((id) => id !== userId)
        : [...prev.memberIds, userId];

      return {
        ...prev,
        memberIds: selected,
      };
    });
  }

  function submit(event) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError('Project name should be at least 2 characters');
      return;
    }

    setError('');
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
      memberIds: form.memberIds,
    });
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <Field label="Project Name">
        <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
      </Field>

      <Field label="Description">
        <textarea
          rows={3}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
      </Field>

      <Field label="Color Theme">
        <div className="color-picker">
          {PROJECT_COLORS.map((color) => (
            <button
              type="button"
              key={color}
              className={form.color === color ? 'active' : ''}
              style={{ background: PROJECT_COLOR_VALUES[color] }}
              onClick={() => setForm((prev) => ({ ...prev, color }))}
            />
          ))}
        </div>
      </Field>

      {allUsers.length > 0 ? (
        <Field label="Team Members">
          <div className="member-checks">
            {allUsers.map((user) => (
              <label key={user.id}>
                <input
                  type="checkbox"
                  checked={form.memberIds.includes(user.id)}
                  onChange={() => toggleMember(user.id)}
                />
                <span>{user.name}</span>
              </label>
            ))}
          </div>
        </Field>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="btn-primary" loading={submitting}>
          {currentProject ? 'Save Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}

export default function ProjectsPage({ user, projects, users, onDataChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canManageProjects = user.role === 'admin';

  async function saveProject(payload) {
    setSubmitting(true);
    setError('');

    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, payload);
      } else {
        await api.createProject(payload);
      }

      await onDataChange();
      setModalOpen(false);
      setEditingProject(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeProject(projectId) {
    const ok = window.confirm('Delete this project and related tasks?');
    if (!ok) return;

    try {
      await api.deleteProject(projectId);
      await onDataChange();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="page-content">
      <header className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Create and organize projects with clear ownership and member access.</p>
        </div>
        {canManageProjects ? (
          <Button
            className="btn-primary"
            onClick={() => {
              setEditingProject(null);
              setModalOpen(true);
            }}
          >
            New Project
          </Button>
        ) : null}
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      {projects.length === 0 ? (
        <EmptyState title="No projects available" subtitle="Create the first project to start assigning tasks" />
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            const completion = project.totalTasks
              ? Math.round((project.doneTasks / project.totalTasks) * 100)
              : 0;

            return (
              <article key={project.id} className="project-card">
                <div className="project-title-row">
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.description || 'No description yet'}</p>
                  </div>
                  {canManageProjects ? (
                    <div className="task-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(project);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => removeProject(project.id)}>
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="task-meta">
                  <span className="project-dot" style={{ background: PROJECT_COLOR_VALUES[project.color] || '#2563eb' }} />
                  <span>{project.totalTasks} tasks</span>
                  <Badge text={`${completion}% done`} color="#1f2937" bg="#e2e8f0" />
                </div>

                <div className="project-members">
                  {project.members.map((member) => (
                    <div key={member.id} className="member-chip">
                      <Avatar name={member.name} role={member.role} size={24} />
                      <span>{member.name}</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editingProject ? 'Edit Project' : 'New Project'}
        onClose={() => {
          setModalOpen(false);
          setEditingProject(null);
        }}
      >
        <ProjectForm
          allUsers={users}
          currentProject={editingProject}
          onSubmit={saveProject}
          onCancel={() => {
            setModalOpen(false);
            setEditingProject(null);
          }}
          submitting={submitting}
        />
      </Modal>
    </section>
  );
}
