import { useState, useEffect } from 'react';

export default function SavedJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications?status=saved')
      .then(r => r.json()).then(d => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const moveToStatus = async (id: string, status: string) => {
    await fetch(`/api/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  if (loading) return <div className="empty-state"><div style={{ animation: 'pulse 1.5s infinite' }}>Loading saved jobs...</div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{jobs.length} saved job{jobs.length !== 1 ? 's' : ''}</p>
        <a href="/search" className="btn btn-primary">🔍 Find More Jobs</a>
      </div>

      {jobs.length > 0 ? (
        <div className="flex flex-col gap-4">
          {jobs.map((job: any) => (
            <div key={job.id} className="card" style={{ padding: 'var(--space-5)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 style={{ fontWeight: 600 }}>{job.job_title}</h4>
                  <p className="text-muted text-sm">{job.company} · {job.location || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => moveToStatus(job.id, 'shortlisted')}>⭐ Shortlist</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => moveToStatus(job.id, 'applied')}>📤 Applied</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => moveToStatus(job.id, 'archived')}>📦 Archive</button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {job.work_mode && <span className="badge badge-neutral">{(job.work_mode || '').replace(/_/g, ' ')}</span>}
                {job.salary_text && <span className="badge badge-success">₹ {job.salary_text}</span>}
                {job.fit_score && <span className="badge badge-info">Score: {Math.round(job.fit_score)}</span>}
              </div>
              {job.notes && <p className="text-sm text-muted mt-2">{job.notes}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">💾</div>
          <div className="empty-state-title">No Saved Jobs</div>
          <div className="empty-state-text">Save jobs from search results to review them later.</div>
          <a href="/search" className="btn btn-primary">Search Jobs</a>
        </div>
      )}
    </div>
  );
}
