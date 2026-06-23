import { useState, useEffect } from 'react';

export default function AdminDB() {
  const [backups, setBackups] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetch('/api/backups').then(r => r.json()).then(d => setBackups(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBackups(prev => [{ id: Date.now(), filename: data.filename, size: data.size, type: 'full', status: 'completed', created_at: new Date().toISOString() }, ...prev]);
      }
    } catch {}
    setCreating(false);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="animate-fade-in">
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))', borderColor: 'rgba(59,130,246,0.3)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>💿 Database & Storage</h2>
        <p className="text-muted text-sm">Manage database backups, storage, and data integrity. Using SQLite in local mode.</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-icon blue"><span>💿</span></div><div><div className="stat-value">SQLite</div><div className="stat-label">Provider</div></div></div>
        <div className="stat-card"><div className="stat-icon green"><span>📁</span></div><div><div className="stat-value">./data/</div><div className="stat-label">Location</div></div></div>
        <div className="stat-card"><div className="stat-icon purple"><span>💾</span></div><div><div className="stat-value">{backups.length}</div><div className="stat-label">Backups</div></div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Backups</h3>
          <button className="btn btn-primary" onClick={createBackup} disabled={creating}>{creating ? '⏳ Creating...' : '💾 Create Backup'}</button>
        </div>
        {backups.length > 0 ? (
          <div className="table-container">
            <table>
              <thead><tr><th>Filename</th><th>Size</th><th>Type</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {backups.map((b: any) => (
                  <tr key={b.id}>
                    <td className="text-sm">{b.filename}</td>
                    <td className="text-sm">{formatSize(b.size)}</td>
                    <td><span className="badge badge-neutral">{b.type}</span></td>
                    <td><span className="badge badge-success">{b.status}</span></td>
                    <td className="text-xs text-muted">{b.created_at ? new Date(b.created_at).toLocaleString('en-IN') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-muted text-sm">No backups yet. Create your first backup above.</p>}
      </div>
    </div>
  );
}
