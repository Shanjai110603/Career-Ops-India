import { useState, useEffect } from 'react';

interface Analytics {
  totalJobs: number;
  totalApplications: number;
  statusBreakdown: { status: string; count: number }[];
  averageScore: number;
  jobsThisWeek: number;
  topCompanies: { company: string; count: number }[];
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then(r => r.json()),
      fetch('/api/applications?limit=5').then(r => r.json()),
    ]).then(([a, apps]) => {
      setAnalytics(a);
      setRecentApps(Array.isArray(apps) ? apps.slice(0, 5) : []);
    }).catch(() => {
      setAnalytics({ totalJobs: 0, totalApplications: 0, statusBreakdown: [], averageScore: 0, jobsThisWeek: 0, topCompanies: [] });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><div style={{ animation: 'pulse 1.5s infinite' }}>Loading dashboard...</div></div>;

  const stats = [
    { label: 'Total Jobs', value: analytics?.totalJobs ?? 0, icon: '💼', color: 'purple' },
    { label: 'Applications', value: analytics?.totalApplications ?? 0, icon: '📤', color: 'blue' },
    { label: 'This Week', value: analytics?.jobsThisWeek ?? 0, icon: '📅', color: 'green' },
    { label: 'Avg Score', value: analytics?.averageScore ? Math.round(analytics.averageScore) + '/100' : '—', icon: '⭐', color: 'orange' },
  ];

  const statusMap: Record<string, { label: string; color: string }> = {
    discovered: { label: 'Discovered', color: '#64748b' },
    saved: { label: 'Saved', color: '#6366f1' },
    shortlisted: { label: 'Shortlisted', color: '#8b5cf6' },
    applied: { label: 'Applied', color: '#3b82f6' },
    interview_scheduled: { label: 'Interviewing', color: '#f97316' },
    offer_received: { label: 'Offer', color: '#22c55e' },
    rejected: { label: 'Rejected', color: '#ef4444' },
    no_response: { label: 'No Response', color: '#9ca3af' },
  };

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', borderColor: 'rgba(99,102,241,0.3)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          Welcome to Career-Ops India 🇮🇳
        </h2>
        <p className="text-muted">Your AI-powered job search operating system. Start by setting up your profile, then search for jobs or add them manually.</p>
        <div className="flex gap-3 mt-4">
          <a href="/profile" className="btn btn-primary">Set Up Profile</a>
          <a href="/search" className="btn btn-secondary">Search Jobs</a>
          <a href="/admin/ai" className="btn btn-secondary">Configure AI</a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.color}`}>
              <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Pipeline Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pipeline Status</h3>
          </div>
          {analytics?.statusBreakdown && analytics.statusBreakdown.length > 0 ? (
            <div className="flex flex-col gap-3">
              {analytics.statusBreakdown.map((s: any) => {
                const info = statusMap[s.status] || { label: s.status, color: '#64748b' };
                return (
                  <div key={s.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: info.color }} />
                      <span className="text-sm">{info.label}</span>
                    </div>
                    <span className="font-bold">{s.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted text-sm">No applications yet. Start by searching for jobs and tracking your applications.</p>
          )}
        </div>

        {/* Top Companies */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Companies</h3>
          </div>
          {analytics?.topCompanies && analytics.topCompanies.length > 0 ? (
            <div className="flex flex-col gap-3">
              {analytics.topCompanies.slice(0, 8).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{c.company}</span>
                  <span className="badge badge-neutral">{c.count} jobs</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">Add jobs to see your most common companies here.</p>
          )}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card mt-6">
        <div className="card-header">
          <h3 className="card-title">Recent Applications</h3>
          <a href="/tracker" className="btn btn-ghost btn-sm">View All →</a>
        </div>
        {recentApps.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((app: any) => (
                  <tr key={app.id}>
                    <td>{app.job_title}</td>
                    <td>{app.company}</td>
                    <td><span className="badge badge-info">{(app.status || '').replace(/_/g, ' ')}</span></td>
                    <td>{app.fit_score ? `${Math.round(app.fit_score)}/100` : '—'}</td>
                    <td className="text-muted text-xs">{app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-sm">No applications tracked yet.</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card mt-6">
        <h3 className="card-title mb-4">Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          {[
            { href: '/search', icon: '🔍', label: 'Search Jobs' },
            { href: '/resume', icon: '📝', label: 'Create Resume' },
            { href: '/career-switch', icon: '🔄', label: 'Plan Career Switch' },
            { href: '/role-packs', icon: '🎯', label: 'Manage Role Packs' },
            { href: '/admin/ai', icon: '🤖', label: 'Setup AI Provider' },
            { href: '/settings', icon: '⚙️', label: 'App Settings' },
          ].map(a => (
            <a key={a.href} href={a.href} className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
              <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
              <span className="text-sm">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
