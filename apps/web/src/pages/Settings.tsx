import { useState, useEffect } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('workspace');
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetch('/api/settings').then(r => r.json()).then(d => setSettings(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const updateSetting = async (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const categories = ['workspace', 'features', 'deployment', 'database', 'security'];
  const categoryLabels: Record<string, string> = { workspace: '🏗️ Workspace', features: '✨ Features', deployment: '🚀 Deployment', database: '💿 Database', security: '🔒 Security' };

  const filtered = settings.filter(s => s.category === activeTab);

  return (
    <div className="animate-fade-in">
      <div className="tabs">
        {categories.map(c => (
          <button key={c} className={`tab ${activeTab === c ? 'active' : ''}`} onClick={() => setActiveTab(c)}>
            {categoryLabels[c] || c}
          </button>
        ))}
      </div>

      {saved && <div className="badge badge-success mb-4" style={{ padding: '8px 16px' }}>✅ Setting saved</div>}

      <div className="flex flex-col gap-4">
        {filtered.map((s: any) => (
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
        {filtered.length === 0 && <p className="text-muted text-sm">No settings in this category.</p>}
      </div>
    </div>
  );
}
