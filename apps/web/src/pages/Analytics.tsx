import { useState, useEffect } from 'react';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><div style={{ animation: 'pulse 1.5s infinite' }}>Loading analytics...</div></div>;

  const statusColors: Record<string, string> = {
    discovered: '#64748b', saved: '#6366f1', shortlisted: '#8b5cf6', applied: '#3b82f6',
    interview_scheduled: '#f97316', offer_received: '#22c55e', rejected: '#ef4444', no_response: '#9ca3af',
  };

  return (
    <div className="animate-fade-in">
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon purple"><span>💼</span></div><div><div className="stat-value">{data?.totalJobs || 0}</div><div className="stat-label">Total Jobs</div></div></div>
        <div className="stat-card"><div className="stat-icon blue"><span>📤</span></div><div><div className="stat-value">{data?.totalApplications || 0}</div><div className="stat-label">Applications</div></div></div>
        <div className="stat-card"><div className="stat-icon green"><span>📅</span></div><div><div className="stat-value">{data?.jobsThisWeek || 0}</div><div className="stat-label">This Week</div></div></div>
        <div className="stat-card"><div className="stat-icon orange"><span>⭐</span></div><div><div className="stat-value">{data?.averageScore ? Math.round(data.averageScore) : '—'}</div><div className="stat-label">Avg Score</div></div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title mb-4">Pipeline Breakdown</h3>
          {data?.statusBreakdown?.length > 0 ? (
            <div className="flex flex-col gap-3">
              {data.statusBreakdown.map((s: any) => {
                const max = Math.max(...data.statusBreakdown.map((x: any) => x.count));
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
          <h3 className="card-title mb-4">Top Companies</h3>
          {data?.topCompanies?.length > 0 ? (
            <div className="flex flex-col gap-3">
              {data.topCompanies.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted text-xs" style={{ minWidth: 20 }}>#{i + 1}</span>
                    <span className="text-sm">{c.company}</span>
                  </div>
                  <span className="badge badge-neutral">{c.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted text-sm">No data yet.</p>}
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="card-title mb-4">Conversion Funnel</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: 200, paddingTop: 'var(--space-4)' }}>
          {['discovered', 'saved', 'shortlisted', 'applied', 'interview_scheduled', 'offer_received', 'accepted'].map(status => {
            const count = data?.statusBreakdown?.find((s: any) => s.status === status)?.count || 0;
            const max = Math.max(1, ...(data?.statusBreakdown?.map((s: any) => s.count) || [1]));
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
    </div>
  );
}
