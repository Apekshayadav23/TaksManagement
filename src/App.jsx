import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, setToken, getToken } from './api/client';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import ProjectsPage from './components/ProjectsPage';
import TasksPage from './components/TasksPage';
import TeamPage from './components/TeamPage';
import Sidebar from './components/Sidebar';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!getToken()) return;

    const requests = [api.getDashboard(), api.getProjects(), api.getTasks()];
    const includeUsers = user?.role === 'admin';

    if (includeUsers) requests.push(api.getUsers());

    const responses = await Promise.all(requests);

    setDashboard(responses[0]);
    setProjects(responses[1].projects || []);
    setTasks(responses[2].tasks || []);

    if (includeUsers) {
      setUsers(responses[3].users || []);
    } else {
      setUsers([]);
    }
  }, [user?.role]);

  useEffect(() => {
    async function boot() {
      setLoading(true);
      const token = getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await api.me();
        setUser(me.user);
      } catch (requestError) {
        setToken(null);
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  useEffect(() => {
    async function hydrate() {
      if (!user) return;
      setLoading(true);
      setError('');

      try {
        await loadData();
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    hydrate();
  }, [user, loadData]);

  const myProjects = useMemo(() => projects, [projects]);

  function logout() {
    setToken(null);
    setUser(null);
    setProjects([]);
    setTasks([]);
    setDashboard(null);
    setUsers([]);
    setPage('dashboard');
  }

  if (!user) {
    return (
      <AuthPage
        onAuthenticated={async (authUser) => {
          setUser(authUser);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="app-loading">
        <p>Loading workspace...</p>
      </div>
    );
  }

  const isProjectPage = page.startsWith('project:');
  const projectId = isProjectPage ? page.split(':')[1] : null;

  return (
    <div className="app-shell">
      <Sidebar user={user} currentPage={page} onPageChange={setPage} onLogout={logout} projects={myProjects} />

      <main className="app-main">
        {error ? <p className="form-error global-error">{error}</p> : null}

        {page === 'dashboard' ? <DashboardPage user={user} dashboard={dashboard} tasks={tasks} /> : null}

        {page === 'projects' ? (
          <ProjectsPage
            user={user}
            projects={projects}
            users={users}
            onDataChange={async () => {
              await loadData();
            }}
          />
        ) : null}

        {page === 'tasks' ? (
          <TasksPage
            user={user}
            tasks={tasks}
            projects={projects}
            onDataChange={async () => {
              await loadData();
            }}
            filterProjectId={null}
          />
        ) : null}

        {page === 'team' && user.role === 'admin' ? (
          <TeamPage
            currentUser={user}
            users={users}
            onDataChange={async () => {
              await loadData();
            }}
          />
        ) : null}

        {isProjectPage ? (
          <TasksPage
            user={user}
            tasks={tasks}
            projects={projects}
            onDataChange={async () => {
              await loadData();
            }}
            filterProjectId={projectId}
          />
        ) : null}
      </main>
    </div>
  );
}
