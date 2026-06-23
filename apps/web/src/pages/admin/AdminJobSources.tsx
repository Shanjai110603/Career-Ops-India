import { useState, useEffect } from 'react';

export default function AdminJobSources() {
  const [sources, setSources] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', type: 'portal', baseUrl: '', priority: 5, scanSchedule: '', enabled: true });

  useEffect(() => { fetch('/api/job-sources').then(r => r.json()).then(d => setSources(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const addSource = async () => {
    await fetch('/api/job-sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSource) });
    setShowAdd(false);
    const res = await fetch('/api/job-sources');
    setSources(await res.json());
  };

  const defaultSources = [
    { name: 'Naukri.com', type: 'portal', baseUrl: 'https://www.naukri.com', priority: 10 },
    { name: 'LinkedIn Jobs', type: 'portal', baseUrl: 'https://www.linkedin.com/jobs', priority: 9 },
    { name: 'Indeed India', type: 'portal', baseUrl: 'https://in.indeed.com', priority: 8 },
    { name: 'Glassdoor', type: 'portal', baseUrl: 'https://www.glassdoor.co.in', priority: 7 },
    { name: 'Internshala', type: 'portal', baseUrl: 'https://internshala.com', priority: 6 },
    { name: 'Foundit (Monster)', type: 'portal', baseUrl: 'https://www.foundit.in', priority: 5 },
    { name: 'Shine.com', type: 'portal', baseUrl: 'https://www.shine.com', priority: 4 },
    { name: 'Freshersworld', type: 'portal', baseUrl: 'https://www.freshersworld.com', priority: 3 },
    { name: 'Instahyre', type: 'portal', baseUrl: 'https://www.instahyre.com', priority: 6 },
    { name: 'Wellfound (AngelList)', type: 'portal', baseUrl: 'https://wellfound.com', priority: 5 },
  ];

  const seedSources = async () => {
    for (const s of defaultSources) {
      await fetch('/api/job-sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
    }
    const res = await fetch('/api/job-sources');
    setSources(await res.json());
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{sources.length} job source{sources.length !== 1 ? 's' : ''} configured</p>
        <div className="flex gap-2">
          {sources.length === 0 && <button className="btn btn-secondary" onClick={seedSources}>🌱 Seed Default Sources</button>}
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ Add Source</button>
        </div>
      </div>

      {sources.length > 0 ? (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>URL</th><th>Priority</th><th>Status</th><th>Last Scan</th></tr></thead>
            <tbody>
              {sources.map((s: any) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td><span className="badge badge-neutral">{s.type}</span></td>
                  <td className="text-xs text-muted">{s.base_url || '—'}</td>
                  <td className="text-sm">{s.priority}/10</td>
                  <td><span className={`badge ${s.enabled ? 'badge-success' : 'badge-neutral'}`}>{s.enabled ? 'Active' : 'Disabled'}</span></td>
                  <td className="text-xs text-muted">{s.last_scan_at || 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🌐</div>
          <div className="empty-state-title">No Job Sources</div>
          <div className="empty-state-text">Add Indian job portals and job boards to search from.</div>
          <button className="btn btn-primary" onClick={seedSources}>🌱 Seed 10 Default Indian Portals</button>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-header"><h3 className="modal-title">Add Job Source</h3><button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Type</label>
                <select className="form-select" value={newSource.type} onChange={e => setNewSource({ ...newSource, type: e.target.value })}>
                  <option value="portal">Job Portal</option><option value="api">API</option><option value="manual">Manual</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Base URL</label><input className="form-input" value={newSource.baseUrl} onChange={e => setNewSource({ ...newSource, baseUrl: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Priority (1-10)</label><input className="form-input" type="number" min="1" max="10" value={newSource.priority} onChange={e => setNewSource({ ...newSource, priority: parseInt(e.target.value) })} /></div>
            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addSource} disabled={!newSource.name}>Add Source</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
