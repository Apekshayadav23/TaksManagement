import { useState } from 'react';
import { api } from '../api/client';
import { Avatar, Badge, Button, EmptyState, Field, Modal } from './common';

function UserForm({ currentUser, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() => ({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    password: '',
    role: currentUser?.role || 'member',
  }));
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();

    if (form.name.trim().length < 2) {
      setError('Name should be at least 2 characters');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('A valid email is required');
      return;
    }

    if (!currentUser && form.password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }

    setError('');
    onSubmit({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    });
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <Field label="Name">
        <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
      </Field>

      <Field label="Email">
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
      </Field>

      {currentUser ? null : (
        <Field label="Password">
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
        </Field>
      )}

      <Field label="Role">
        <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </Field>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="btn-primary" loading={submitting}>
          {currentUser ? 'Save Member' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
}

export default function TeamPage({ currentUser, users, onDataChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function saveUser(payload) {
    setSubmitting(true);
    setError('');

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, payload);
      } else {
        await api.createUser(payload);
      }

      await onDataChange();
      setModalOpen(false);
      setEditingUser(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeUser(userId) {
    const ok = window.confirm('Remove this member?');
    if (!ok) return;

    try {
      await api.deleteUser(userId);
      await onDataChange();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="page-content">
      <header className="page-header">
        <div>
          <h1>Team Management</h1>
          <p>Manage members, roles, and assignments for the workspace.</p>
        </div>
        <Button
          className="btn-primary"
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
        >
          Invite Member
        </Button>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      {users.length === 0 ? (
        <EmptyState title="No team members" subtitle="Invite users to start collaborating" />
      ) : (
        <div className="team-grid">
          {users.map((user) => (
            <article key={user.id} className="member-card">
              <div className="member-top">
                <Avatar name={user.name} role={user.role} size={42} />
                <div className="member-identity">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                </div>
                <Badge text={user.role} color={user.role === 'admin' ? '#1d4ed8' : '#0f766e'} bg="#dbeafe" />
              </div>

              <div className="member-stats">
                <div>
                  <strong>{user.projectCount || 0}</strong>
                  <span>Projects</span>
                </div>
                <div>
                  <strong>{user.assignedTasks || 0}</strong>
                  <span>Tasks</span>
                </div>
                <div>
                  <strong>{user.completedTasks || 0}</strong>
                  <span>Done</span>
                </div>
              </div>

              {user.id !== currentUser.id ? (
                <div className="member-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(user);
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => removeUser(user.id)}>
                    Remove
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editingUser ? 'Edit Member' : 'Invite Member'}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
      >
        <UserForm
          currentUser={editingUser}
          onSubmit={saveUser}
          onCancel={() => {
            setModalOpen(false);
            setEditingUser(null);
          }}
          submitting={submitting}
        />
      </Modal>
    </section>
  );
}
