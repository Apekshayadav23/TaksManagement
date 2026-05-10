import { PROJECT_COLOR_VALUES } from '../config/constants';

export function Avatar({ name, role, size = 34 }) {
  const initials = (name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, Math.floor(size * 0.36)),
        background: role === 'admin' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(13, 148, 136, 0.14)',
        color: role === 'admin' ? '#1d4ed8' : '#0f766e',
      }}
    >
      {initials}
    </div>
  );
}

export function Badge({ text, color, bg }) {
  return (
    <span className="badge" style={{ color, background: bg }}>
      {text}
    </span>
  );
}

export function Button({ children, className = '', loading = false, ...props }) {
  return (
    <button className={`btn ${className}`.trim()} disabled={loading || props.disabled} {...props}>
      {loading ? 'Please wait...' : children}
    </button>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <small>{error}</small> : null}
    </label>
  );
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <header>
          <h3>{title}</h3>
          <button type="button" onClick={onClose}>
            x
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, subtitle }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

export function ProjectDot({ color }) {
  return <span className="project-dot" style={{ background: PROJECT_COLOR_VALUES[color] || '#2563eb' }} />;
}
