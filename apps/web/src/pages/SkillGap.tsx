import { useState, useEffect } from 'react';

export default function SkillGap() {
  const [plans, setPlans] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ targetRole: '', currentSkills: '', requiredSkills: '' });

  useEffect(() => { fetch('/api/skill-gap-plans').then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: form.targetRole,
          currentSkills: form.currentSkills,
          requiredSkills: form.requiredSkills
        }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      await fetch('/api/skill-gap-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: form.targetRole,
          transferableSkills: data.transferableSkills || [],
          missingSkills: data.missingSkills || [],
          shouldApplyNow: !!data.shouldApplyNow,
          recommendation: data.recommendation || '',
          plan7Day: data.plan7Day || [],
          plan30Day: data.plan30Day || [],
          plan90Day: data.plan90Day || [],
        }),
      });

      setShowCreate(false);
      const listRes = await fetch('/api/skill-gap-plans');
      setPlans(await listRes.json());
    } catch (err: any) {
      alert('Failed to analyze gaps: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{plans.length} skill gap plan{plans.length !== 1 ? 's' : ''}</p>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>📈 New Skill Gap Analysis</button>
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h3 className="card-title mb-4">Analyze Skill Gaps</h3>
          <div className="form-group">
            <label className="form-label">Target Role</label>
            <input className="form-input" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} placeholder="e.g. Data Analyst" />
          </div>
          <div className="form-group">
            <label className="form-label">Your Current Skills (comma-separated)</label>
            <input className="form-input" value={form.currentSkills} onChange={e => setForm({ ...form, currentSkills: e.target.value })} placeholder="Excel, SQL, Communication, Python..." />
          </div>
          <div className="form-group">
            <label className="form-label">Required Skills for Target Role (comma-separated)</label>
            <input className="form-input" value={form.requiredSkills} onChange={e => setForm({ ...form, requiredSkills: e.target.value })} placeholder="Python, SQL, Tableau, Statistics, Machine Learning..." />
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={analyze} disabled={!form.targetRole || loading}>
              {loading ? '⏳ Analyzing...' : '📊 Analyze Gaps'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {plans.length > 0 ? (
        <div className="flex flex-col gap-4">
          {plans.map((p: any) => {
            const transferable = JSON.parse(p.transferable_skills || '[]');
            const missing = JSON.parse(p.missing_skills || '[]');
            return (
              <div key={p.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h4 style={{ fontWeight: 600 }}>{p.target_role || 'Untitled Plan'}</h4>
                  <span className={`badge ${p.should_apply_now ? 'badge-success' : 'badge-warning'}`}>
                    {p.should_apply_now ? '✅ Apply Now' : '⏳ Upskill First'}
                  </span>
                </div>
                <div className="grid-2">
                  <div>
                    <h5 className="text-sm font-bold mb-2" style={{ color: 'var(--success)' }}>Transferable ({transferable.length})</h5>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                      {transferable.map((s: string) => <span key={s} className="badge badge-success">{s}</span>)}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold mb-2" style={{ color: 'var(--warning)' }}>Missing ({missing.length})</h5>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                      {missing.map((s: string) => <span key={s} className="badge badge-warning">{s}</span>)}
                    </div>
                  </div>
                </div>
                {p.recommendation && <p className="text-sm text-muted mt-3">💡 {p.recommendation}</p>}
              </div>
            );
          })}
        </div>
      ) : !showCreate ? (
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <div className="empty-state-title">No Skill Gap Plans</div>
          <div className="empty-state-text">Compare your current skills against target roles to identify what you need to learn.</div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Start Analysis</button>
        </div>
      ) : null}
    </div>
  );
}
