import { Outlet, NavLink, useLocation } from 'react-router-dom';

const CORE_NAV_ITEMS = [
  { section: 'Main' },
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/search', label: 'Job Board', icon: '🔍' },
  { path: '/tracker', label: 'Applications', icon: '📋' },
  { section: 'Career' },
  { path: '/resume', label: 'Resume Studio', icon: '📝' },
  { path: '/career-planner', label: 'Career Planner', icon: '🔄' },
  { path: '/interview-prep', label: 'Interview Prep', icon: '🎤' },
  { section: 'Account' },
  { path: '/profile', label: 'Profile & Settings', icon: '👤' },
  { path: '/admin', label: 'Admin Panel', icon: '⚙️' },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard & Analytics',
  '/search': 'Universal Job Board',
  '/tracker': 'Application Tracker',
  '/resume': 'Resume Studio',
  '/career-planner': 'Career Switch & Skill Gap Planner',
  '/interview-prep': 'Interview Preparation',
  '/profile': 'My Profile & Settings',
  '/admin': 'Admin Dashboard Control Panel',
};

export function Layout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Career-Ops India';

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      {/* Background visual wow space-glow mesh nodes */}
      <div style={{
        position: 'fixed',
        top: '20%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        zIndex: -1,
        pointerEvents: 'none',
        animation: 'float 8s ease-in-out infinite'
      }} />
      <div style={{
        position: 'fixed',
        bottom: '20%',
        right: '15%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(217, 70, 239, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        zIndex: -1,
        pointerEvents: 'none',
        animation: 'float 12s ease-in-out infinite'
      }} />
      
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: '1.5rem' }}>🚀</span>
          <div>
            <h1>Career-Ops</h1>
            <span className="logo-badge">India</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {CORE_NAV_ITEMS.map((item, i) => {
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
