import { useState, useEffect } from 'react';

export default function AdminRolePacks() {
  const [packs, setPacks] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPack, setNewPack] = useState({ name: '', family: '', description: '', keywords: '', excludeKeywords: '', skills: '', interviewTopics: '', resumeStrategy: '' });

  useEffect(() => { fetch('/api/role-packs').then(r => r.json()).then(d => setPacks(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const addPack = async () => {
    await fetch('/api/role-packs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newPack,
        keywords: newPack.keywords.split(',').map(s => s.trim()).filter(Boolean),
        excludeKeywords: newPack.excludeKeywords.split(',').map(s => s.trim()).filter(Boolean),
        skills: newPack.skills.split(',').map(s => s.trim()).filter(Boolean),
        interviewTopics: newPack.interviewTopics.split(',').map(s => s.trim()).filter(Boolean),
      }),
    });
    setShowAdd(false);
    const res = await fetch('/api/role-packs');
    setPacks(await res.json());
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{packs.length} role packs ({packs.filter((p: any) => p.isCustom || p.is_custom).length} custom)</p>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ Create Custom Role Pack</button>
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Name</th><th>Family</th><th>Type</th><th>Keywords</th><th>Skills</th><th>Status</th></tr></thead>
          <tbody>
            {packs.map((p: any) => {
              const keywords = Array.isArray(p.keywords) ? p.keywords : JSON.parse(p.keywords || '[]');
              const skills = Array.isArray(p.skills) ? p.skills : JSON.parse(p.skills || '[]');
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td className="text-sm">{p.family}</td>
                  <td><span className={`badge ${p.isCustom || p.is_custom ? 'badge-warning' : 'badge-info'}`}>{p.isCustom || p.is_custom ? 'Custom' : 'Built-in'}</span></td>
                  <td className="text-xs text-muted">{keywords.slice(0, 3).join(', ')}{keywords.length > 3 ? '...' : ''}</td>
                  <td className="text-xs text-muted">{skills.slice(0, 3).join(', ')}{skills.length > 3 ? '...' : ''}</td>
                  <td><span className={`badge ${p.enabled !== false ? 'badge-success' : 'badge-neutral'}`}>{p.enabled !== false ? 'Active' : 'Disabled'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-header"><h3 className="modal-title">Create Custom Role Pack</h3><button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={newPack.name} onChange={e => setNewPack({ ...newPack, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Family</label><input className="form-input" value={newPack.family} onChange={e => setNewPack({ ...newPack, family: e.target.value })} placeholder="e.g. engineering" /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={newPack.description} onChange={e => setNewPack({ ...newPack, description: e.target.value })} rows={2} /></div>
            <div className="form-group"><label className="form-label">Keywords (comma-separated)</label><input className="form-input" value={newPack.keywords} onChange={e => setNewPack({ ...newPack, keywords: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Exclude Keywords (comma-separated)</label><input className="form-input" value={newPack.excludeKeywords} onChange={e => setNewPack({ ...newPack, excludeKeywords: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Skills (comma-separated)</label><input className="form-input" value={newPack.skills} onChange={e => setNewPack({ ...newPack, skills: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Interview Topics (comma-separated)</label><input className="form-input" value={newPack.interviewTopics} onChange={e => setNewPack({ ...newPack, interviewTopics: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Resume Strategy</label><textarea className="form-textarea" value={newPack.resumeStrategy} onChange={e => setNewPack({ ...newPack, resumeStrategy: e.target.value })} rows={3} /></div>
            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addPack} disabled={!newPack.name}>Create Pack</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
