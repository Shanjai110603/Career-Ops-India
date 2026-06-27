import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Analytics {
  totalJobs: number;
  totalApplications: number;
  statusBreakdown: { status: string; count: number }[];
  averageScore: number;
  jobsThisWeek: number;
  topCompanies: { company: string; count: number }[];
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
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

  const getStageCount = (statusKeys: string[]) => {
    if (!analytics?.statusBreakdown) return 0;
    return analytics.statusBreakdown
      .filter((s: any) => statusKeys.includes(s.status))
      .reduce((acc: number, curr: any) => acc + curr.count, 0);
  };

  const discoveredCount = getStageCount(['discovered']);
  const savedCount = getStageCount(['saved']);
  const shortlistedCount = getStageCount(['shortlisted']);
  const appliedCount = getStageCount(['applied', 'resume_tailored']);
  const interviewingCount = getStageCount(['interview_scheduled', 'hr_round', 'technical_round', 'manager_round']);
  const offerCount = getStageCount(['offer_received', 'accepted']);

  const funnelStages = [
    { label: 'Discovered', count: discoveredCount, color: 'rgba(99, 102, 241, 0.8)' },
    { label: 'Saved', count: savedCount, color: 'rgba(139, 92, 246, 0.8)' },
    { label: 'Shortlisted', count: shortlistedCount, color: 'rgba(168, 85, 247, 0.8)' },
    { label: 'Applied', count: appliedCount, color: 'rgba(59, 130, 246, 0.8)' },
    { label: 'Interviewing', count: interviewingCount, color: 'rgba(249, 115, 22, 0.8)' },
    { label: 'Offers', count: offerCount, color: 'rgba(34, 197, 94, 0.8)' },
  ];

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

  const statusColors: Record<string, string> = {
    discovered: '#64748b', saved: '#6366f1', shortlisted: '#8b5cf6', applied: '#3b82f6',
    interview_scheduled: '#f97316', offer_received: '#22c55e', rejected: '#ef4444', no_response: '#9ca3af',
  };

  return (
    <div className="animate-fade-in">
      {/* Navigation tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          📊 Overview Dashboard
        </button>
        <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          📈 Analytics & Conversions
        </button>
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

      {activeTab === 'overview' ? (
        <>
          {/* Welcome Banner */}
          <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', borderColor: 'rgba(99,102,241,0.3)' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Welcome to Career-Ops India 🇮🇳
            </h2>
            <p className="text-muted">Your AI-powered job search operating system. Start by setting up your profile, then search for jobs or add them manually.</p>
            <div className="flex gap-3 mt-4">
              <Link to="/profile" className="btn btn-primary">Set Up Profile</Link>
              <Link to="/search" className="btn btn-secondary">Search Jobs</Link>
              <Link to="/admin" className="btn btn-secondary">Admin Dashboard</Link>
            </div>
          </div>

          <div className="grid-2">
            {/* Pipeline Breakdown */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Pipeline Conversion Funnel</h3>
              </div>
              {analytics?.statusBreakdown && analytics.statusBreakdown.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* SVG Funnel Visualizer */}
                  <div style={{ background: 'rgba(10, 14, 26, 0.3)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center' }}>
                    <svg width="100%" height="240" viewBox="0 0 400 240" style={{ maxWidth: 400 }}>
                      <defs>
                        <linearGradient id="funnelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.85" />
                        </linearGradient>
                      </defs>
                      {funnelStages.map((stage, i) => {
                        const topY = i * 36 + 10;
                        const bottomY = topY + 28;
                        
                        const baseWidthTop = 340 - i * 46;
                        const baseWidthBottom = 340 - (i + 1) * 46;
                        
                        const points = `${200 - baseWidthTop / 2},${topY} ${200 + baseWidthTop / 2},${topY} ${200 + baseWidthBottom / 2},${bottomY} ${200 - baseWidthBottom / 2},${bottomY}`;
                        
                        // Conversion rate relative to preceding stage
                        const precedingCount = i > 0 ? funnelStages[i - 1].count : 0;
                        const stepConversion = i === 0 ? 100 : (precedingCount > 0 ? Math.round((stage.count / precedingCount) * 100) : 0);
                        
                        return (
                          <g key={stage.label}>
                            {/* Trapezoid layer */}
                            <polygon 
                              points={points} 
                              fill="url(#funnelGrad)"
                              opacity={0.15 + (stage.count > 0 ? 0.65 : 0.05)}
                              style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                            />
                            {/* Label text */}
                            <text x={200} y={topY + 18} fill="var(--text-primary)" fontSize="11" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                              {stage.label}: {stage.count} {i > 0 && stage.count > 0 ? `(${stepConversion}% step-conv)` : ''}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Status List Breakdown */}
                  <div className="flex flex-col gap-2" style={{ maxHeight: 150, overflowY: 'auto', paddingRight: '4px' }}>
                    {analytics.statusBreakdown.map((s: any) => {
                      const info = statusMap[s.status] || { label: s.status, color: '#64748b' };
                      return (
                        <div key={s.status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: info.color }} />
                            <span className="text-sm">{info.label}</span>
                          </div>
                          <span className="font-bold text-sm">{s.count}</span>
                        </div>
                      );
                    })}
                  </div>
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
              <Link to="/tracker" className="btn btn-ghost btn-sm">View All →</Link>
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
                        <td>{app.jobTitle}</td>
                        <td>{app.company}</td>
                        <td><span className="badge badge-info">{(app.status || '').replace(/_/g, ' ')}</span></td>
                        <td>{app.fitScore ? `${Math.round(app.fitScore)}/100` : '—'}</td>
                        <td className="text-muted text-xs">{app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN') : ''}</td>
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
                { href: '/career-planner', icon: '🔄', label: 'Career Planner' },
                { href: '/tracker', icon: '📋', label: 'Application Tracker' },
                { href: '/profile', icon: '👤', label: 'Profile & Settings' },
                { href: '/admin', icon: '⚙️', label: 'Admin Dashboard' },
              ].map(a => (
                <Link key={a.href} to={a.href} className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                  <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
                  <span className="text-sm">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Detailed Analytics Tab */}
          <div className="grid-2">
            <div className="card">
              <h3 className="card-title mb-4">Pipeline Status Details</h3>
              {analytics?.statusBreakdown && analytics.statusBreakdown.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {analytics.statusBreakdown.map((s: any) => {
                    const max = Math.max(...analytics.statusBreakdown.map((x: any) => x.count));
                    const pct = max > 0 ? (s.count / max) * 100 : 0;
                    return (
                      <div key={s.status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{(s.status || '').replace(/_/g, ' ')}</span>
                          <span className="text-sm font-bold">{s.count}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: statusColors[s.status] || '#64748b', borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-muted text-sm">No data yet.</p>}
            </div>

            <div className="card">
              <h3 className="card-title mb-4">Full Company Distributions</h3>
              {analytics?.topCompanies && analytics.topCompanies.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {analytics.topCompanies.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-muted text-xs" style={{ minWidth: 20 }}>#{i + 1}</span>
                        <span className="text-sm">{c.company}</span>
                      </div>
                      <span className="badge badge-neutral">{c.count} applications</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted text-sm">No data yet.</p>}
            </div>
          </div>

          <div className="card mt-6">
            <h3 className="card-title mb-4">Pipeline Conversion Bar Chart</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 220, paddingTop: 'var(--space-6)' }}>
              {['discovered', 'saved', 'shortlisted', 'applied', 'interview_scheduled', 'offer_received', 'accepted'].map(status => {
                const count = analytics?.statusBreakdown?.find((s: any) => s.status === status)?.count || 0;
                const max = Math.max(1, ...(analytics?.statusBreakdown?.map((s: any) => s.count) || [1]));
                const height = Math.max(4, (count / max) * 160);
                return (
                  <div key={status} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="text-xs font-bold">{count}</span>
                    <div style={{ width: '100%', height, background: statusColors[status] || '#64748b', borderRadius: 'var(--radius-sm)', transition: 'height 0.5s ease' }} />
                    <span className="text-xs text-muted" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', maxHeight: 60, overflow: 'hidden' }}>
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
