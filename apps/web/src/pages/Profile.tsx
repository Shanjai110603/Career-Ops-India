import { useState, useEffect } from 'react';

export default function Profile() {
  const [profile, setProfile] = useState<any>({
    name: '', email: '', phone: '', location: '', stateCode: '', experienceYears: 0,
    currentRole: '', targetRoles: [], skills: [], education: { degree: '', institution: '', year: '' },
    summary: '', linkedinUrl: '', portfolioUrl: '', githubUrl: '',
    preferredWorkModes: [], preferredLocations: [], salaryExpectationLPA: 0, noticePeriodDays: 30,
    isCareerSwitching: false, switchFromRole: '', switchToRole: '', switchMode: '',
  });
  const [saved, setSaved] = useState(false);
  const [states, setStates] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/profiles').then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) {
        const p = d[0];
        setProfile({
          id: p.id, name: p.name || '', email: p.email || '', phone: p.phone || '',
          location: p.location || '', stateCode: p.state_code || '',
          experienceYears: p.experience_years || 0, currentRole: p.current_role || '',
          targetRoles: JSON.parse(p.target_roles || '[]'),
          skills: JSON.parse(p.skills || '[]'),
          education: JSON.parse(p.education || '{}'),
          summary: p.summary || '', linkedinUrl: p.linkedin_url || '',
          portfolioUrl: p.portfolio_url || '', githubUrl: p.github_url || '',
          preferredWorkModes: JSON.parse(p.preferred_work_modes || '[]'),
          preferredLocations: JSON.parse(p.preferred_locations || '[]'),
          salaryExpectationLPA: p.salary_expectation_lpa || 0,
          noticePeriodDays: p.notice_period_days || 30,
          isCareerSwitching: !!p.is_career_switching,
          switchFromRole: p.switch_from_role || '',
          switchToRole: p.switch_to_role || '', switchMode: p.switch_mode || '',
        });
      }
    }).catch(() => {});
    fetch('/api/locations/states').then(r => r.json()).then(setStates).catch(() => {});
  }, []);

  const saveProfile = async () => {
    await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in">
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))', borderColor: 'rgba(59,130,246,0.3)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>👤 My Profile</h2>
        <p className="text-muted">Your profile powers scoring, resume generation, career switch analysis, and interview prep. Keep it complete and up-to-date.</p>
      </div>

      <div className="card">
        <h3 className="card-title mb-4">Personal Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+91..." />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Location (City)</label>
            <input className="form-input" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <select className="form-select" value={profile.stateCode} onChange={e => setProfile({ ...profile, stateCode: e.target.value })}>
              <option value="">Select State</option>
              {states.map((s: any) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <h3 className="card-title mb-4 mt-6">Professional Details</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Current Role</label>
            <input className="form-input" value={profile.currentRole} onChange={e => setProfile({ ...profile, currentRole: e.target.value })} placeholder="e.g. Software Engineer" />
          </div>
          <div className="form-group">
            <label className="form-label">Experience (Years)</label>
            <input className="form-input" type="number" min="0" step="0.5" value={profile.experienceYears} onChange={e => setProfile({ ...profile, experienceYears: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Notice Period (Days)</label>
            <input className="form-input" type="number" value={profile.noticePeriodDays} onChange={e => setProfile({ ...profile, noticePeriodDays: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Target Roles (comma-separated)</label>
          <input className="form-input" value={profile.targetRoles.join(', ')} onChange={e => setProfile({ ...profile, targetRoles: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="Product Manager, Business Analyst..." />
        </div>
        <div className="form-group">
          <label className="form-label">Skills (comma-separated)</label>
          <input className="form-input" value={profile.skills.join(', ')} onChange={e => setProfile({ ...profile, skills: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="JavaScript, Python, SQL, Communication..." />
        </div>
        <div className="form-group">
          <label className="form-label">Professional Summary</label>
          <textarea className="form-textarea" value={profile.summary} onChange={e => setProfile({ ...profile, summary: e.target.value })} rows={4} />
        </div>
        <div className="form-group">
          <label className="form-label">Salary Expectation (LPA)</label>
          <input className="form-input" type="number" min="0" step="0.5" value={profile.salaryExpectationLPA} onChange={e => setProfile({ ...profile, salaryExpectationLPA: parseFloat(e.target.value) || 0 })} />
        </div>

        <h3 className="card-title mb-4 mt-6">Links</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">LinkedIn</label>
            <input className="form-input" value={profile.linkedinUrl} onChange={e => setProfile({ ...profile, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="form-group">
            <label className="form-label">GitHub</label>
            <input className="form-input" value={profile.githubUrl} onChange={e => setProfile({ ...profile, githubUrl: e.target.value })} placeholder="https://github.com/..." />
          </div>
          <div className="form-group">
            <label className="form-label">Portfolio</label>
            <input className="form-input" value={profile.portfolioUrl} onChange={e => setProfile({ ...profile, portfolioUrl: e.target.value })} />
          </div>
        </div>

        <h3 className="card-title mb-4 mt-6">Career Switch</h3>
        <div className="form-group">
          <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={profile.isCareerSwitching} onChange={e => setProfile({ ...profile, isCareerSwitching: e.target.checked })} />
            <span className="form-label" style={{ marginBottom: 0 }}>I am switching careers</span>
          </label>
        </div>
        {profile.isCareerSwitching && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Switching From</label>
              <input className="form-input" value={profile.switchFromRole} onChange={e => setProfile({ ...profile, switchFromRole: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Switching To</label>
              <input className="form-input" value={profile.switchToRole} onChange={e => setProfile({ ...profile, switchToRole: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Switch Mode</label>
              <select className="form-select" value={profile.switchMode} onChange={e => setProfile({ ...profile, switchMode: e.target.value })}>
                <option value="">Select</option>
                <option value="adjacent">Adjacent</option>
                <option value="hard">Hard Switch</option>
                <option value="dual_track">Dual Track</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button className="btn btn-primary btn-lg" onClick={saveProfile} disabled={!profile.name}>
            {saved ? '✅ Profile Saved!' : '💾 Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
