import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../config/constants';
import { Badge, Button, EmptyState, Field, Modal, ProjectDot } from './common';

const defaultTask = {
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
};

function TaskForm({ projects, currentTask, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() =>
    currentTask
      ? {
          title: currentTask.title,
          description: currentTask.description || '',
          projectId: currentTask.projectId,
          assigneeId: currentTask.assigneeId || '',
          status: currentTask.status,
          priority: currentTask.priority,
          dueDate: currentTask.dueDate || '',
        }
      : { ...defaultTask },
  );

  const [errors, setErrors] = useState({});

  const selectedProject = projects.find((project) => project.id === form.projectId);
  const members = selectedProject?.members || [];

  function validate() {
    const next = {};
    if (form.title.trim().length < 2) next.title = 'Task title should be at least 2 characters';
    if (!form.projectId) next.projectId = 'Project is required';
    return next;
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      assigneeId: form.assigneeId || null,
      dueDate: form.dueDate || null,
    });
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <Field label="Task Title" error={errors.title}>
        <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
      </Field>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          rows={3}
        />
      </Field>

      <div className="form-row">
        <Field label="Project" error={errors.projectId}>
          <select value={form.projectId} onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Assignee">
          <select value={form.assigneeId} onChange={(event) => setForm((prev) => ({ ...prev, assigneeId: event.target.value }))}>
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="form-row">
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priority">
          <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Due Date">
        <input type="date" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} />
      </Field>

      <div className="form-actions">
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="btn-primary" loading={submitting}>
          {currentTask ? 'Save Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}

export default function TasksPage({ user, tasks, projects, onDataChange, filterProjectId }) {
  const [filters, setFilters] = useState({ search: '', status: 'all', priority: 'all' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const visibleProjects = filterProjectId ? projects.filter((project) => project.id === filterProjectId) : projects;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterProjectId && task.projectId !== filterProjectId) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.search) {
        const target = `${task.title} ${task.description || ''}`.toLowerCase();
        return target.includes(filters.search.toLowerCase());
      }
      return true;
    });
  }, [tasks, filters, filterProjectId]);

  const canCreate = visibleProjects.length > 0;

  async function createOrUpdateTask(payload) {
    setSubmitting(true);
    setError('');

    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      } else {
        await api.createTask(payload);
      }

      setModalOpen(false);
      setEditingTask(null);
      await onDataChange();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeTask(taskId) {
    const ok = window.confirm('Delete this task?');
    if (!ok) return;

    try {
      await api.deleteTask(taskId);
      await onDataChange();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="page-content">
      <header className="page-header">
        <div>
          <h1>{filterProjectId ? `${visibleProjects[0]?.name || 'Project'} Tasks` : 'Tasks'}</h1>
          <p>Plan, assign, and monitor progress with status and due-date tracking.</p>
        </div>
        {canCreate ? (
          <Button
            className="btn-primary"
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
          >
            New Task
          </Button>
        ) : null}
      </header>

      <div className="filters-row">
        <input
          placeholder="Search tasks"
          value={filters.search}
          onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
        />
        <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
        >
          <option value="all">All Priorities</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {filteredTasks.length === 0 ? (
        <EmptyState title="No tasks found" subtitle="Create a task or adjust filters" />
      ) : (
        <div className="task-grid">
          {filteredTasks.map((task) => {
            const status = STATUS_OPTIONS.find((entry) => entry.value === task.status);
            const priority = PRIORITY_OPTIONS.find((entry) => entry.value === task.priority);
            const dueOver = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
            const canEdit = user.role === 'admin' || user.id === task.creatorId || user.id === task.assigneeId;

            return (
              <article key={task.id} className="task-card">
                <div className="task-top">
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description || 'No description provided'}</p>
                  </div>
                  {canEdit ? (
                    <div className="task-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTask(task);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => removeTask(task.id)}>
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="task-meta">
                  <ProjectDot color={task.project?.color} />
                  <span>{task.project?.name || 'No Project'}</span>
                </div>

                <div className="task-badges">
                  <Badge text={status?.label || task.status} color={status?.color || '#334155'} bg={status?.bg || '#e2e8f0'} />
                  <Badge
                    text={priority?.label || task.priority}
                    color={priority?.color || '#334155'}
                    bg={priority?.bg || '#e2e8f0'}
                  />
                  {dueOver ? <Badge text="Overdue" color="#991b1b" bg="#fee2e2" /> : null}
                </div>

                <div className="task-footer">
                  <span>Assignee: {task.assignee?.name || 'Unassigned'}</span>
                  <span>Due: {task.dueDate || '-'}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editingTask ? 'Edit Task' : 'New Task'}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
      >
        <TaskForm
          projects={visibleProjects}
          currentTask={editingTask}
          onSubmit={createOrUpdateTask}
          onCancel={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
          submitting={submitting}
        />
      </Modal>
    </section>
  );
}
