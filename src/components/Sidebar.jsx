import { Avatar } from './common';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'tasks', label: 'Tasks' },
];

export default function Sidebar({ user, currentPage, onPageChange, onLogout, projects }) {
  const nav = user.role === 'admin' ? [...NAV_ITEMS, { id: 'team', label: 'Team' }] : NAV_ITEMS;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span>TaskFlow</span>
        <small>Team Planner</small>
      </div>

      <nav className="sidebar-nav">
        {nav.map((item) => (
          <button
            type="button"
            key={item.id}
            className={currentPage === item.id ? 'active' : ''}
            onClick={() => onPageChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-projects">
        <h4>Projects</h4>
        {projects.map((project) => (
          <button
            type="button"
            key={project.id}
            className={currentPage === `project:${project.id}` ? 'active' : ''}
            onClick={() => onPageChange(`project:${project.id}`)}
          >
            {project.name}
          </button>
        ))}
      </div>

      <div className="sidebar-user">
        <Avatar name={user.name} role={user.role} size={36} />
        <div>
          <strong>{user.name}</strong>
          <small>{user.role}</small>
        </div>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
