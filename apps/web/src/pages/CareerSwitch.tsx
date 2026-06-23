import { useState } from 'react';

export default function CareerSwitch() {
  const [plan, setPlan] = useState({
    currentRole: '', targetRole: '', switchMode: 'adjacent',
    transferableSkills: '', missingSkills: '', motivation: '', timeline: '6',
  });
  const [analysis, setAnalysis] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/career-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAnalysis(data);
    } catch (err: any) {
      alert('Failed to analyze transition: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const transferable = plan.transferableSkills.split(',').map(s => s.trim()).filter(Boolean);
    const missing = plan.missingSkills.split(',').map(s => s.trim()).filter(Boolean);
    await fetch('/api/skill-gap-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetRole: plan.targetRole,
        transferableSkills: transferable,
        missingSkills: missing,
        plan7Day: analysis?.plan7Day || [],
        plan30Day: analysis?.plan30Day || [],
        plan90Day: analysis?.plan90Day || [],
        shouldApplyNow: (analysis?.transitionReadiness || 0) > 60,
        recommendation: analysis?.recommendations?.join(' ') || '',
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in">
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(168,85,247,0.1))', borderColor: 'rgba(139,92,246,0.3)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>🔄 Career Switch Planner</h2>
        <p className="text-muted">Plan your career transition. Define your current and target roles, identify transferable skills, and get a personalized switch roadmap.</p>
      </div>

      <div className="grid-2">
        {/* Input Form */}
        <div className="card">
          <h3 className="card-title mb-4">Define Your Switch</h3>
          <div className="form-group">
            <label className="form-label">Current Role / Domain</label>
            <input className="form-input" value={plan.currentRole} onChange={e => setPlan({ ...plan, currentRole: e.target.value })} placeholder="e.g. Customer Support Executive" />
          </div>
          <div className="form-group">
            <label className="form-label">Target Role / Domain</label>
            <input className="form-input" value={plan.targetRole} onChange={e => setPlan({ ...plan, targetRole: e.target.value })} placeholder="e.g. Product Manager" />
          </div>
          <div className="form-group">
            <label className="form-label">Switch Mode</label>
            <select className="form-select" value={plan.switchMode} onChange={e => setPlan({ ...plan, switchMode: e.target.value })}>
              <option value="adjacent">Adjacent Switch — Related domain, leveraging current experience</option>
              <option value="hard">Hard Switch — Completely different domain</option>
              <option value="dual_track">Dual Track — Search safe + target roles simultaneously</option>
            </select>
            <span className="form-hint">
              {plan.switchMode === 'adjacent' && 'Adjacent switches have the highest success rate — you can leverage existing skills.'}
              {plan.switchMode === 'hard' && 'Hard switches require more preparation — consider bridge roles as stepping stones.'}
              {plan.switchMode === 'dual_track' && 'Dual track lets you maintain income security while pursuing your target career.'}
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">Transferable Skills</label>
            <input className="form-input" value={plan.transferableSkills} onChange={e => setPlan({ ...plan, transferableSkills: e.target.value })} placeholder="Communication, Problem Solving, Excel, SQL..." />
            <span className="form-hint">Skills from your current role that apply to the target (comma-separated)</span>
          </div>
          <div className="form-group">
            <label className="form-label">Missing Skills</label>
            <input className="form-input" value={plan.missingSkills} onChange={e => setPlan({ ...plan, missingSkills: e.target.value })} placeholder="Python, Data Analysis, Product Strategy..." />
            <span className="form-hint">Skills you need to develop for the target role (comma-separated)</span>
          </div>
          <div className="form-group">
            <label className="form-label">Timeline (months)</label>
            <select className="form-select" value={plan.timeline} onChange={e => setPlan({ ...plan, timeline: e.target.value })}>
              <option value="3">3 months (Aggressive)</option>
              <option value="6">6 months (Standard)</option>
              <option value="12">12 months (Comfortable)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Why I'm Switching</label>
            <textarea className="form-textarea" value={plan.motivation} onChange={e => setPlan({ ...plan, motivation: e.target.value })} rows={3} placeholder="Explain your motivation — this will help generate your career switch narrative for resumes and interviews..." />
          </div>
          <button className="btn btn-primary w-full" onClick={handleAnalyze} disabled={!plan.currentRole || !plan.targetRole || loading}>
            {loading ? '⏳ Analyzing Switch...' : '🔄 Analyze My Switch'}
          </button>
        </div>

        {/* Analysis Results */}
        <div>
          {analysis ? (
            <div className="flex flex-col gap-4">
              {/* Scores */}
              <div className="card">
                <h3 className="card-title mb-4">Switch Analysis</h3>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="stat-card"><div className="stat-icon purple"><span>🔄</span></div><div><div className="stat-value">{analysis.switchScore}</div><div className="stat-label">Switch Score</div></div></div>
                  <div className="stat-card"><div className="stat-icon green"><span>✅</span></div><div><div className="stat-value">{analysis.transitionReadiness}%</div><div className="stat-label">Readiness</div></div></div>
                  <div className="stat-card"><div className="stat-icon blue"><span>🌉</span></div><div><div className="stat-value">{analysis.bridgeRolePotential}</div><div className="stat-label">Bridge Score</div></div></div>
                </div>
              </div>

              {/* Skills */}
              <div className="card">
                <h3 className="card-title mb-4">Skills Analysis</h3>
                <div className="mb-4">
                  <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--success)' }}>✅ Transferable Skills ({analysis.transferable.length})</h4>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {analysis.transferable.map((s: string) => <span key={s} className="badge badge-success">{s}</span>)}
                    {analysis.transferable.length === 0 && <span className="text-muted text-sm">None specified</span>}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--warning)' }}>⚠️ Skills to Develop ({analysis.missing.length})</h4>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {analysis.missing.map((s: string) => <span key={s} className="badge badge-warning">{s}</span>)}
                    {analysis.missing.length === 0 && <span className="text-muted text-sm">None specified</span>}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="card">
                <h3 className="card-title mb-4">Recommendations</h3>
                <div className="flex flex-col gap-3">
                  {analysis.recommendations.map((r: string, i: number) => (
                    <div key={i} className="flex gap-3 items-center">
                      <span style={{ color: 'var(--accent-primary)' }}>💡</span>
                      <span className="text-sm">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Plans */}
              {['plan7Day', 'plan30Day', 'plan90Day'].map((planKey, i) => (
                <div key={planKey} className="card">
                  <h3 className="card-title mb-4">{['📅 7-Day Plan', '📅 30-Day Plan', '📅 90-Day Plan'][i]}</h3>
                  <div className="flex flex-col gap-2">
                    {(analysis[planKey] || []).map((item: string, j: number) => (
                      <div key={j} className="flex gap-2 items-center text-sm">
                        <span className="text-muted">□</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button className="btn btn-primary" onClick={handleSave} disabled={saved}>
                {saved ? '✅ Saved!' : '💾 Save Career Switch Plan'}
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔄</div>
              <div className="empty-state-title">Ready to Analyze</div>
              <div className="empty-state-text">Fill in your current and target roles, then click "Analyze My Switch" to get your personalized career switch plan.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
