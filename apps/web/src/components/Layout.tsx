import { Outlet, NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { section: 'Main' },
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/search', label: 'Job Search', icon: '🔍' },
  { path: '/saved', label: 'Saved Jobs', icon: '💾' },
  { path: '/tracker', label: 'Applications', icon: '📋' },
  { section: 'Career' },
  { path: '/resume', label: 'Resume Studio', icon: '📝' },
  { path: '/career-switch', label: 'Career Switch', icon: '🔄' },
  { path: '/interview-prep', label: 'Interview Prep', icon: '🎤' },
  { path: '/skill-gap', label: 'Skill Gaps', icon: '📈' },
  { path: '/role-packs', label: 'Role Packs', icon: '🎯' },
  { section: 'Account' },
  { path: '/profile', label: 'My Profile', icon: '👤' },
  { path: '/analytics', label: 'Analytics', icon: '📉' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
  { section: 'Admin' },
  { path: '/admin/ai', label: 'AI Providers', icon: '🤖' },
  { path: '/admin/database', label: 'Database', icon: '💿' },
  { path: '/admin/role-packs', label: 'Manage Roles', icon: '🏷️' },
  { path: '/admin/job-sources', label: 'Job Sources', icon: '🌐' },
  { path: '/admin/locations', label: 'Locations', icon: '📍' },
  { path: '/admin/security', label: 'Security', icon: '🔒' },
  { path: '/admin/workspace', label: 'Workspace', icon: '🏗️' },
  { path: '/admin/profiles', label: 'Profiles', icon: '👥' },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/search': 'Universal Job Search',
  '/saved': 'Saved Jobs',
  '/tracker': 'Application Tracker',
  '/resume': 'Resume Studio',
  '/career-switch': 'Career Switch Planner',
  '/interview-prep': 'Interview Preparation',
  '/skill-gap': 'Skill Gap Planner',
  '/role-packs': 'Role Pack Manager',
  '/profile': 'My Profile',
  '/analytics': 'Analytics & Reports',
  '/settings': 'Settings',
  '/admin/ai': 'Admin — AI Providers',
  '/admin/database': 'Admin — Database & Storage',
  '/admin/role-packs': 'Admin — Role Packs',
  '/admin/job-sources': 'Admin — Job Sources',
  '/admin/locations': 'Admin — India Locations',
  '/admin/security': 'Admin — Security & Privacy',
  '/admin/workspace': 'Admin — Workspace & Deployment',
  '/admin/profiles': 'Admin — Profile Management',
};

export function Layout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Career-Ops India';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: '1.5rem' }}>🚀</span>
          <div>
            <h1>Career-Ops</h1>
            <span className="logo-badge">India</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            if ('section' in item && item.section) {
              return <div key={i} className="sidebar-section">{item.section}</div>;
            }
            if ('path' in item) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path!}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              );
            }
            return null;
          })}
        </nav>
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
          v1.0.0 · Local Mode
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <h2 className="topbar-title">{title}</h2>
          <div className="flex items-center gap-3">
            <span className="badge badge-success">● Online</span>
          </div>
        </header>
        <div className="page-content animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
