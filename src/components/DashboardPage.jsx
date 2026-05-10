import { STATUS_OPTIONS } from '../config/constants';
import { Badge, EmptyState } from './common';

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <h4>{label}</h4>
      <p>{value}</p>
    </article>
  );
}

export default function DashboardPage({ user, dashboard, tasks }) {
  const myTasks = tasks.filter((task) => task.assigneeId === user.id).slice(0, 5);

  if (!dashboard) {
    return <EmptyState title="Loading dashboard" subtitle="Please wait while we gather your latest stats" />;
  }

  return (
    <section className="page-content">
      <header className="page-header">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]}</h1>
          <p>Track overall progress, pending work, and overdue tasks.</p>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard label="Total Tasks" value={dashboard.stats.totalTasks} />
        <StatCard label="In Progress" value={dashboard.stats.inProgressTasks} />
        <StatCard label="Overdue" value={dashboard.stats.overdueTasks} />
        <StatCard label="Completed" value={dashboard.stats.doneTasks} />
      </div>

      <div className="panel-grid">
        <article className="panel">
          <h3>Status Breakdown</h3>
          <div className="status-list">
            {STATUS_OPTIONS.map((status) => {
              const item = dashboard.byStatus.find((entry) => entry.status === status.value);
              const count = item?.count || 0;
              const width = dashboard.stats.totalTasks ? (count / dashboard.stats.totalTasks) * 100 : 0;

              return (
                <div key={status.value} className="status-item">
                  <div>
                    <span>{status.label}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="status-progress">
                    <span style={{ width: `${width}%`, background: status.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <h3>My Recent Tasks</h3>
          {myTasks.length === 0 ? (
            <EmptyState title="No tasks assigned" subtitle="Tasks assigned to you will appear here" />
          ) : (
            <div className="recent-tasks">
              {myTasks.map((task) => {
                const status = STATUS_OPTIONS.find((item) => item.value === task.status);
                return (
                  <div key={task.id} className="recent-item">
                    <div>
                      <strong>{task.title}</strong>
                      <small>{task.project?.name || 'No Project'}</small>
                    </div>
                    <Badge text={status?.label || task.status} color={status?.color || '#334155'} bg={status?.bg || '#e2e8f0'} />
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
