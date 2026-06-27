import { useState, useEffect } from 'react';

export default function AdminSecurity() {
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/audit-log?limit=50').then(r => r.json()).then(d => setAuditLog(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/settings?category=security').then(r => r.json()).then(d => setSettings(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const updateSetting = async (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
  };

  return (
    <div className="animate-fade-in">
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.1))', borderColor: 'rgba(239,68,68,0.3)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>🔒 Security & Privacy</h2>
        <p className="text-muted text-sm">All data stays local. No telemetry, no cloud sync unless you enable it. API keys are encrypted at rest.</p>
      </div>

      {/* Security Settings */}
      <div className="card mb-6">
        <h3 className="card-title mb-4">Security Settings</h3>
        {settings.map((s: any) => (
          <div key={s.key} className="flex items-center justify-between" style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h4 className="text-sm font-bold">{s.label || s.key}</h4>
              {s.description && <p className="text-xs text-muted">{s.description}</p>}
            </div>
            {s.type === 'boolean' ? (
              <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={s.value === 'true'} onChange={e => updateSetting(s.key, e.target.checked ? 'true' : 'false')} />
                <span className="text-sm">{s.value === 'true' ? 'On' : 'Off'}</span>
              </label>
            ) : (
              <input className="form-input" style={{ maxWidth: 200 }} value={s.value} onChange={e => updateSetting(s.key, e.target.value)} />
            )}
          </div>
        ))}
      </div>

      {/* Security Features */}
      <div className="grid-3 mb-6">
        {[
          { icon: '🏠', title: 'Local-First', desc: 'All data stored on your machine' },
          { icon: '🔐', title: 'Encrypted Keys', desc: 'API keys encrypted at rest' },
          { icon: '🚫', title: 'No Telemetry', desc: 'Zero tracking or data collection' },
          { icon: '🛡️', title: 'PII Redaction', desc: 'Strip personal data from AI calls' },
          { icon: '📋', title: 'Audit Logging', desc: 'Full audit trail of all actions' },
          { icon: '💾', title: 'Auto Backups', desc: 'Regular database backups' },
        ].map(f => (
          <div key={f.title} className="card" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>{f.icon}</span>
            <h4 className="text-sm font-bold mt-4">{f.title}</h4>
            <p className="text-xs text-muted">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Audit Log */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Audit Log</h3>
          <span className="text-xs text-muted">{auditLog.length} entries</span>
        </div>
        {auditLog.length > 0 ? (
          <div className="table-container">
            <table>
              <thead><tr><th>Action</th><th>Entity</th><th>Details</th><th>Timestamp</th></tr></thead>
              <tbody>
                {auditLog.slice(0, 30).map((log: any) => (
                  <tr key={log.id}>
                    <td><span className="badge badge-neutral">{log.action}</span></td>
                    <td className="text-sm">{log.entityType} / {log.entityId?.slice(0, 8)}</td>
                    <td className="text-xs text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details?.slice(0, 50) || '—'}</td>
                    <td className="text-xs text-muted">{log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-muted text-sm">No audit events yet.</p>}
      </div>
    </div>
  );
}
