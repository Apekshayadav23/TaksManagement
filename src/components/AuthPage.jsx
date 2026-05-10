import { useMemo, useState } from 'react';
import { api, setToken } from '../api/client';
import { Button, Field } from './common';

const initialState = {
  name: '',
  email: '',
  password: '',
};

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => (mode === 'login' ? 'Sign In' : 'Create Account'), [mode]);

  function validate() {
    const next = {};

    if (mode === 'signup' && form.name.trim().length < 2) {
      next.name = 'Name should be at least 2 characters';
    }

    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = 'Please enter a valid email';
    }

    if (!form.password) {
      next.password = 'Password is required';
    } else if (mode === 'signup' && form.password.length < 6) {
      next.password = 'Password should be at least 6 characters';
    }

    return next;
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      const response =
        mode === 'login'
          ? await api.login(payload)
          : await api.signup({ ...payload, name: form.name.trim() });

      setToken(response.token);
      onAuthenticated(response.user);
    } catch (error) {
      if (mode === 'login') {
        setMessage('Invalid email or password');
      } else {
        setMessage(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          <p>TaskFlow</p>
          <h1>Team Task Manager</h1>
          <span>Projects, team collaboration, and task tracking in one place</span>
        </div>

        <div className="switcher" role="tablist" aria-label="Authentication mode">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            Signup
          </button>
        </div>

        <form onSubmit={submit} className="form-grid">
          {mode === 'signup' ? (
            <Field label="Full Name" error={errors.name}>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Jane Cooper"
              />
            </Field>
          ) : null}

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="you@company.com"
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="At least 6 characters"
            />
          </Field>

          {message ? <p className="form-error">{message}</p> : null}

          <Button type="submit" className="btn-primary" loading={submitting}>
            {title}
          </Button>
        </form>

        {mode === 'login' ? (
          <div className="demo-panel">
            <p>Login Examples</p>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, email: 'admin@demo.com', password: 'admin123' }))}
            >
              Admin: admin@demo.com / admin123
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, email: 'wrong@demo.com', password: 'wrong123' }))}
            >
              Wrong Example: wrong@demo.com / wrong123
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, email: 'admin@demo.com', password: 'admin123' }))}
            >
              ID: admin@demo.com
            </button>
            <button type="button" onClick={() => setForm((prev) => ({ ...prev, email: 'admin@demo.com', password: 'admin123' }))}>
              Password: admin123
            </button>
          </div>
        ) : null}

      </div>
    </div>
  );
}
