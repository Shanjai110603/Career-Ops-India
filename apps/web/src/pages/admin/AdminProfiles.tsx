import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AdminProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => { fetch('/api/profiles').then(r => r.json()).then(d => setProfiles(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</p>
        <Link to="/profile" className="btn btn-primary">👤 Edit Profile</Link>
      </div>

      {profiles.length > 0 ? (
        <div className="flex flex-col gap-4">
          {profiles.map((p: any) => {
            const skills = JSON.parse(p.skills || '[]');
            const targetRoles = JSON.parse(p.targetRoles || '[]');
            return (
              <div key={p.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="stat-icon purple" style={{ fontSize: '1.5rem' }}>👤</div>
                    <div>
                      <h4 style={{ fontWeight: 600 }}>{p.name || 'Unnamed'}</h4>
                      <p className="text-muted text-xs">{p.email || 'No email'} · {p.location || 'No location'} · {p.experienceYears || 0} yrs</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`badge ${p.isActive ? 'badge-success' : 'badge-neutral'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                    {p.isCareerSwitching && <span className="badge badge-warning">Career Switch</span>}
                  </div>
                </div>
                {p.currentRole && <p className="text-sm mb-2">Current: <strong>{p.currentRole}</strong></p>}
                {targetRoles.length > 0 && <p className="text-sm mb-2">Target: {targetRoles.join(', ')}</p>}
                {skills.length > 0 && (
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {skills.slice(0, 10).map((s: string) => <span key={s} className="badge badge-info">{s}</span>)}
                    {skills.length > 10 && <span className="badge badge-neutral">+{skills.length - 10} more</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">No Profiles</div>
          <div className="empty-state-text">Create your profile to get started with scoring and personalized recommendations.</div>
          <Link to="/profile" className="btn btn-primary">Create Profile</Link>
        </div>
      )}
    </div>
  );
}
