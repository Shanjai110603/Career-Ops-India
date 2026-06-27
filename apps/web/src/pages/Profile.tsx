import { useState, useEffect } from 'react';

const WORK_MODES = [
  { id: 'remote', label: 'Remote' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'onsite', label: 'On-site / WFO' },
  { id: 'wfh', label: 'Work from Home' },
  { id: 'india_remote', label: 'Remote (India)' },
  { id: 'contract', label: 'Contract' },
  { id: 'internship', label: 'Internship' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'part_time', label: 'Part-time' },
];

/** Fix corrupted comma-separated arrays stored as single concatenated string */
function parseArraySafe(raw: string | any[]): string[] {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) {
      return parsed.flatMap((item: string) => {
        if (typeof item !== 'string') return [String(item)];
        if (!item.includes(',') && !item.includes(' ') && item.length > 30) {
          return item.replace(/([a-z])([A-Z])/g, '$1, $2').split(', ').map(s => s.trim()).filter(Boolean);
        }
        return [item];
      });
    }
    return [];
  } catch {
    return [];
  }
}

export default function Profile() {
  const [activeHub, setActiveHub] = useState<'profile' | 'settings'>('profile');

  // Candidate Profile state
  const [profile, setProfile] = useState<any>({
    name: '', email: '', phone: '', location: '', stateCode: '', experienceYears: 0,
    currentRole: '', targetRoles: [], skills: [], education: { degree: '', institution: '', year: '' },
    summary: '', linkedinUrl: '', portfolioUrl: '', githubUrl: '',
    preferredWorkModes: [], preferredLocations: [], salaryExpectationLPA: 0, noticePeriodDays: 30,
    isCareerSwitching: false, switchFromRole: '', switchToRole: '', switchMode: '',
    rolePackIds: [],
  });
  const [saved, setSaved] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [rolePacks, setRolePacks] = useState<any[]>([]);

  // Salary Calculator helper states
  const [salaryInput, setSalaryInput] = useState('12');
  const [hasProfessionalTax, setHasProfessionalTax] = useState(true);
  const [epfContribution, setEpfContribution] = useState('1800');
  const [calculatedSalary, setCalculatedSalary] = useState<any>(null);

  // Settings states
  const [settings, setSettings] = useState<any[]>([]);
  const [activeSettingTab, setActiveSettingTab] = useState('workspace');
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    // Load profile
    fetch('/api/profiles').then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) {
        const p = d[0];
        setProfile({
          id: p.id, name: p.name || '', email: p.email || '', phone: p.phone || '',
          location: p.location || '', stateCode: p.stateCode || '',
          experienceYears: p.experienceYears || 0, currentRole: p.currentRole || '',
          targetRoles: parseArraySafe(p.targetRoles),
          skills: parseArraySafe(p.skills),
          education: (() => { try { return typeof p.education === 'string' ? JSON.parse(p.education) : p.education || {}; } catch { return {}; } })(),
          summary: p.summary || '', linkedinUrl: p.linkedinUrl || '',
          portfolioUrl: p.portfolioUrl || '', githubUrl: p.githubUrl || '',
          preferredWorkModes: parseArraySafe(p.preferredWorkModes),
          preferredLocations: parseArraySafe(p.preferredLocations),
          salaryExpectationLPA: p.salaryExpectationLPA || 0,
          noticePeriodDays: p.noticePeriodDays || 30,
          isCareerSwitching: !!p.isCareerSwitching,
          switchFromRole: p.switchFromRole || '',
          switchToRole: p.switchToRole || '', switchMode: p.switchMode || '',
          rolePackIds: parseArraySafe(p.rolePackIds),
        });
      }
    }).catch(() => {});

    // Load states
    fetch('/api/locations/states').then(r => r.json()).then(setStates).catch(() => {});

    // Load role packs
    fetch('/api/role-packs').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setRolePacks(d);
    }).catch(() => {});

    // Load settings
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setSettings(d);
    }).catch(() => {});
  }, []);

  const saveProfile = async () => {
    await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSalaryCalculate = async () => {
    try {
      const res = await fetch('/api/salary/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ctcLPA: parseFloat(salaryInput),
          professionalTax: hasProfessionalTax,
          customEPFMoonthly: parseFloat(epfContribution)
        })
      });
      const data = await res.json();
      setCalculatedSalary(data);
    } catch (err: any) {
      alert('Calculation failed: ' + err.message);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const togglePreferredMode = (mode: string) => {
    const current = profile.preferredWorkModes || [];
    const next = current.includes(mode) ? current.filter((m: string) => m !== mode) : [...current, mode];
    setProfile({ ...profile, preferredWorkModes: next });
  };

  const toggleRolePack = (packId: string) => {
    const current = profile.rolePackIds || [];
    const next = current.includes(packId) ? current.filter((id: string) => id !== packId) : [...current, packId];
    setProfile({ ...profile, rolePackIds: next });
  };

  const settingCategories = ['workspace', 'features', 'deployment', 'database', 'security'];
  const settingCategoryLabels: Record<string, string> = { 
    workspace: '🏗️ Workspace', 
    features: '✨ Features', 
    deployment: '🚀 Deployment', 
    database: '💿 Database', 
    security: '🔒 Security' 
  };

  const filteredSettings = settings.filter(s => s.category === activeSettingTab);

  return (
    <div className="animate-fade-in">
      {/* Navigation tabs */}
      <div className="tabs">
        <button className={`tab ${activeHub === 'profile' ? 'active' : ''}`} onClick={() => setActiveHub('profile')}>
          👤 Candidate Profile
        </button>
        <button className={`tab ${activeHub === 'settings' ? 'active' : ''}`} onClick={() => setActiveHub('settings')}>
          ⚙️ App Settings
        </button>
      </div>

      {activeHub === 'profile' ? (
        <div className="card">
          <h3 className="card-title mb-4">Personal Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location (City)</label>
              <input className="form-input" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} placeholder="e.g. Chennai" />
            </div>
            <div className="form-group">
              <label className="form-label">State Code</label>
              <select className="form-select" value={profile.stateCode} onChange={e => setProfile({ ...profile, stateCode: e.target.value })}>
                <option value="">Select State</option>
                {states.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <input className="form-input" type="number" step="0.5" value={profile.experienceYears} onChange={e => setProfile({ ...profile, experienceYears: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          <h3 className="card-title mb-4 mt-6">Role Packs Selection</h3>
          <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
            {rolePacks.map(p => {
              const selected = profile.rolePackIds?.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleRolePack(p.id)}
                >
                  {selected ? '✓ ' : ''}{p.name}
                </button>
              );
            })}
          </div>

          <h3 className="card-title mb-4 mt-6">Salary Details & Indian take-home Calculator</h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Expected CTC (LPA)</label>
              <input className="form-input" type="number" step="0.5" value={profile.salaryExpectationLPA} onChange={e => setProfile({ ...profile, salaryExpectationLPA: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Notice Period (Days)</label>
              <input className="form-input" type="number" value={profile.noticePeriodDays} onChange={e => setProfile({ ...profile, noticePeriodDays: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Interactive Calculator Section */}
          <div className="card mt-4 mb-4" style={{ background: 'rgba(139, 92, 246, 0.03)', borderColor: 'var(--border)' }}>
            <h4 className="text-sm font-bold mb-2">🇮🇳 In-Hand Take-Home Salary Estimator</h4>
            <p className="text-xs text-muted mb-4">Calculate New Regime slab taxes, EPF, Professional Tax, and Gratuity allocations.</p>
            <div className="form-row items-center">
              <div className="form-group">
                <label className="form-label">CTC LPA *</label>
                <input className="form-input" type="number" value={salaryInput} onChange={e => setSalaryInput(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly EPF Contribution (INR)</label>
                <input className="form-input" type="number" value={epfContribution} onChange={e => setEpfContribution(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2 mt-4" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasProfessionalTax} onChange={e => setHasProfessionalTax(e.target.checked)} />
                  <span className="text-sm">Professional Tax (₹200)</span>
                </label>
              </div>
              <div className="form-group">
                <button type="button" className="btn btn-secondary mt-4" onClick={handleSalaryCalculate}>Calculate</button>
              </div>
            </div>

            {calculatedSalary && (
              <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px dashed var(--border)' }}>
                <div>
                  <span className="text-xs text-muted">Monthly Gross</span>
                  <p className="font-bold text-sm">₹{Math.round(calculatedSalary.monthlyGrossSalary).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-xs text-muted">Monthly Tax Deducted</span>
                  <p className="font-bold text-sm" style={{ color: 'var(--danger)' }}>₹{Math.round(calculatedSalary.monthlyTaxDeducted).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-xs text-muted">In-Hand Net / Month</span>
                  <p className="font-bold text-base" style={{ color: 'var(--success)' }}>₹{Math.round(calculatedSalary.monthlyInHandSalary).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-xs text-muted">Effective Tax Rate</span>
                  <p className="font-bold text-sm">{calculatedSalary.effectiveTaxPercentage.toFixed(1)}%</p>
                </div>
              </div>
            )}
          </div>

          <h3 className="card-title mb-4 mt-6">Work Mode Preferences</h3>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {WORK_MODES.map(m => {
              const selected = profile.preferredWorkModes?.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => togglePreferredMode(m.id)}
                >
                  {selected ? '✓ ' : ''}{m.label}
                </button>
              );
            })}
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
      ) : (
        <div className="animate-fade-in">
          {/* Inner settings tabs */}
          <div className="tabs">
            {settingCategories.map(c => (
              <button key={c} className={`tab ${activeSettingTab === c ? 'active' : ''}`} onClick={() => setActiveSettingTab(c)}>
                {settingCategoryLabels[c] || c}
              </button>
            ))}
          </div>

          {settingsSaved && <div className="badge badge-success mb-4" style={{ padding: '8px 16px' }}>Setting saved successfully!</div>}

          <div className="flex flex-col gap-4">
            {filteredSettings.map((s: any) => (
              <div key={s.key} className="card" style={{ padding: 'var(--space-4)' }}>
                <div className="flex items-center justify-between">
                  <div style={{ flex: 1 }}>
                    <h4 className="text-sm font-bold">{s.label || s.key}</h4>
                    {s.description && <p className="text-xs text-muted">{s.description}</p>}
                  </div>
                  <div style={{ width: 300 }}>
                    {s.type === 'boolean' ? (
                      <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                        <input type="checkbox" checked={s.value === 'true'} onChange={e => updateSetting(s.key, e.target.checked ? 'true' : 'false')} />
                        <span className="text-sm">{s.value === 'true' ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    ) : s.type === 'number' ? (
                      <input className="form-input" type="number" value={s.value} onChange={e => updateSetting(s.key, e.target.value)} />
                    ) : (
                      <input className="form-input" value={s.value} onChange={e => updateSetting(s.key, e.target.value)} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredSettings.length === 0 && <p className="text-muted text-sm">No settings in this category.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
