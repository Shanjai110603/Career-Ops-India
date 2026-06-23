import { useState, useEffect } from 'react';

export default function AdminWorkspace() {
  const [settings, setSettings] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings?category=workspace').then(r => r.json()),
      fetch('/api/settings?category=deployment').then(r => r.json()),
    ]).then(([ws, dep]) => setSettings([...(Array.isArray(ws) ? ws : []), ...(Array.isArray(dep) ? dep : [])])).catch(() => {});
  }, []);

  const updateSetting = async (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(99,102,241,0.1))', borderColor: 'rgba(14,165,233,0.3)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>🏗️ Workspace & Deployment</h2>
        <p className="text-muted text-sm">Configure workspace settings and deployment mode.</p>
      </div>

      {saved && <div className="badge badge-success mb-4" style={{ padding: '8px 16px' }}>✅ Setting saved</div>}

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title mb-4">Deployment Mode</h3>
          <div className="flex flex-col gap-3">
            {['local', 'self-hosted', 'cloud', 'desktop'].map(mode => (
              <label key={mode} className="card flex items-center gap-3" style={{ padding: 'var(--space-3)', cursor: 'pointer', borderColor: settings.find(s => s.key === 'deployment_mode')?.value === mode ? 'var(--accent-primary)' : undefined }}>
                <input type="radio" name="deployment_mode" checked={settings.find(s => s.key === 'deployment_mode')?.value === mode} onChange={() => updateSetting('deployment_mode', mode)} />
                <div>
                  <h4 className="text-sm font-bold" style={{ textTransform: 'capitalize' }}>{mode}</h4>
                  <p className="text-xs text-muted">
                    {mode === 'local' && 'Run on your own machine with SQLite'}
                    {mode === 'self-hosted' && 'Deploy on your own server with PostgreSQL'}
                    {mode === 'cloud' && 'Cloud deployment with managed services'}
                    {mode === 'desktop' && 'Tauri desktop application'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title mb-4">Workspace Settings</h3>
          {settings.filter(s => s.category === 'workspace').map(s => (
            <div key={s.key} className="form-group">
              <label className="form-label">{s.label || s.key}</label>
              {s.type === 'boolean' ? (
                <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={s.value === 'true'} onChange={e => updateSetting(s.key, e.target.checked ? 'true' : 'false')} />
                  <span className="text-sm">{s.value === 'true' ? 'Enabled' : 'Disabled'}</span>
                </label>
              ) : (
                <input className="form-input" value={s.value} onChange={e => updateSetting(s.key, e.target.value)} />
              )}
              {s.description && <span className="form-hint">{s.description}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
