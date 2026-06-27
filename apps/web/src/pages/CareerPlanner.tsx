import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CareerPlanner() {
  const [activeTab, setActiveTab] = useState<'packs' | 'gap' | 'switch'>('packs');

  // Role Packs state
  const [packs, setPacks] = useState<any[]>([]);
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);

  // Skill Gaps state
  const [plans, setPlans] = useState<any[]>([]);
  const [showCreateGap, setShowCreateGap] = useState(false);
  const [gapForm, setGapForm] = useState({ targetRole: '', currentSkills: '', requiredSkills: '' });
  const [gapLoading, setGapLoading] = useState(false);

  // Career Switch state
  const [switchForm, setSwitchForm] = useState({
    currentRole: '', targetRole: '', switchMode: 'adjacent',
    transferableSkills: '', missingSkills: '', motivation: '', timeline: '6',
  });
  const [switchAnalysis, setSwitchAnalysis] = useState<any>(null);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchSaved, setSwitchSaved] = useState(false);

  useEffect(() => {
    // Fetch initial list values
    fetch('/api/role-packs').then(r => r.json()).then(d => setPacks(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/skill-gap-plans').then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Skill gap analysis
  const analyzeGaps = async () => {
    setGapLoading(true);
    try {
      const res = await fetch('/api/ai/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: gapForm.targetRole,
          currentSkills: gapForm.currentSkills,
          requiredSkills: gapForm.requiredSkills
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      await fetch('/api/skill-gap-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: gapForm.targetRole,
          transferableSkills: data.transferableSkills || [],
          missingSkills: data.missingSkills || [],
          shouldApplyNow: !!data.shouldApplyNow,
          recommendation: data.recommendation || '',
          plan7Day: data.plan7Day || [],
          plan30Day: data.plan30Day || [],
          plan90Day: data.plan90Day || [],
        }),
      });

      setShowCreateGap(false);
      const listRes = await fetch('/api/skill-gap-plans');
      setPlans(await listRes.json());
    } catch (err: any) {
      alert('Failed to analyze gaps: ' + err.message);
    } finally {
      setGapLoading(false);
    }
  };

  // Career switch analysis
  const analyzeSwitch = async () => {
    setSwitchLoading(true);
    try {
      const res = await fetch('/api/ai/career-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(switchForm),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSwitchAnalysis(data);
    } catch (err: any) {
      alert('Failed to analyze switch transition: ' + err.message);
    } finally {
      setSwitchLoading(false);
    }
  };

  const saveSwitchPlan = async () => {
    const transferable = switchForm.transferableSkills.split(',').map(s => s.trim()).filter(Boolean);
    const missing = switchForm.missingSkills.split(',').map(s => s.trim()).filter(Boolean);
    await fetch('/api/skill-gap-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetRole: switchForm.targetRole,
        transferableSkills: transferable,
        missingSkills: missing,
        plan7Day: switchAnalysis?.plan7Day || [],
        plan30Day: switchAnalysis?.plan30Day || [],
        plan90Day: switchAnalysis?.plan90Day || [],
        shouldApplyNow: (switchAnalysis?.transitionReadiness || 0) > 60,
        recommendation: switchAnalysis?.recommendations?.join(' ') || '',
      }),
    });
    setSwitchSaved(true);
    setTimeout(() => setSwitchSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in">
      {/* Tab switchers */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'packs' ? 'active' : ''}`} onClick={() => setActiveTab('packs')}>
          🎯 Target Role Packs ({packs.length})
        </button>
        <button className={`tab ${activeTab === 'gap' ? 'active' : ''}`} onClick={() => setActiveTab('gap')}>
          📈 Skill Gap Reports ({plans.length})
        </button>
        <button className={`tab ${activeTab === 'switch' ? 'active' : ''}`} onClick={() => setActiveTab('switch')}>
          🔄 Transition Roadmap
        </button>
      </div>

      {activeTab === 'packs' && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted text-sm">{packs.length} role profile packs currently loaded</p>
            <Link to="/admin" className="btn btn-secondary btn-sm">⚙️ Manage Roles</Link>
          </div>

          <div className="flex flex-col gap-4">
            {packs.map((pack: any) => {
              const skills = Array.isArray(pack.skills) ? pack.skills : JSON.parse(pack.skills || '[]');
              const keywords = Array.isArray(pack.keywords) ? pack.keywords : JSON.parse(pack.keywords || '[]');
              const interviewTopics = Array.isArray(pack.interviewTopics || pack.interview_topics) 
                ? (pack.interviewTopics || pack.interview_topics) 
                : JSON.parse(pack.interview_topics || pack.interviewTopics || '[]');
              const isExpanded = expandedPackId === pack.id;

              return (
                <div key={pack.id} className="card" onClick={() => setExpandedPackId(isExpanded ? null : pack.id)} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="stat-icon indigo"><span>🎯</span></div>
                      <div>
                        <h4 style={{ fontWeight: 600 }}>{pack.name}</h4>
                        <p className="text-muted text-xs">{pack.family} · {pack.description?.slice(0, 80) || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${pack.enabled !== false ? 'badge-success' : 'badge-neutral'}`}>
                        {pack.enabled !== false ? 'Active' : 'Disabled'}
                      </span>
                      <span className={`badge ${pack.isCustom || pack.is_custom ? 'badge-warning' : 'badge-info'}`}>
                        {pack.isCustom || pack.is_custom ? 'Custom' : 'Built-in'}
                      </span>
                      <span>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4" onClick={e => e.stopPropagation()}>
                      <div className="grid-2">
                        <div>
                          <h5 className="text-sm font-bold mb-2">Target Keywords</h5>
                          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            {keywords.map((k: string) => <span key={k} className="badge badge-neutral">{k}</span>)}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-bold mb-2">Required Skills</h5>
                          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            {skills.map((s: string) => <span key={s} className="badge badge-info">{s}</span>)}
                          </div>
                        </div>
                      </div>
                      {interviewTopics.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-bold mb-2">Key Interview Topics</h5>
                          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            {interviewTopics.map((t: string) => <span key={t} className="badge badge-warning">{t}</span>)}
                          </div>
                        </div>
                      )}
                      {(pack.resumeStrategy || pack.resume_strategy) && (
                        <div className="mt-4">
                          <h5 className="text-sm font-bold mb-2">Tailoring Strategy</h5>
                          <p className="text-sm text-muted">{pack.resumeStrategy || pack.resume_strategy}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'gap' && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted text-sm">{plans.length} skill analysis plans</p>
            <button className="btn btn-primary" onClick={() => setShowCreateGap(true)}>📈 New Skill Gap Analysis</button>
          </div>

          {showCreateGap && (
            <div className="card mb-6">
              <h3 className="card-title mb-4">Analyze Skill Gaps</h3>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <input className="form-input" value={gapForm.targetRole} onChange={e => setGapForm({ ...gapForm, targetRole: e.target.value })} placeholder="e.g. Data Analyst" />
              </div>
              <div className="form-group">
                <label className="form-label">Your Current Skills (comma-separated)</label>
                <input className="form-input" value={gapForm.currentSkills} onChange={e => setGapForm({ ...gapForm, currentSkills: e.target.value })} placeholder="Excel, SQL, Communication..." />
              </div>
              <div className="form-group">
                <label className="form-label">Required Skills for Target Role (comma-separated)</label>
                <input className="form-input" value={gapForm.requiredSkills} onChange={e => setGapForm({ ...gapForm, requiredSkills: e.target.value })} placeholder="Python, SQL, Tableau..." />
              </div>
              <div className="flex gap-3">
                <button className="btn btn-primary" onClick={analyzeGaps} disabled={!gapForm.targetRole || gapLoading}>
                  {gapLoading ? '⏳ Analyzing...' : '📊 Analyze Gaps'}
                </button>
                <button className="btn btn-ghost" onClick={() => setShowCreateGap(false)}>Cancel</button>
              </div>
            </div>
          )}

          {plans.length > 0 ? (
            <div className="flex flex-col gap-4">
              {plans.map((p: any) => {
                const transferable = JSON.parse(p.transferableSkills || '[]');
                const missing = JSON.parse(p.missingSkills || '[]');
                return (
                  <div key={p.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <h4 style={{ fontWeight: 600 }}>{p.targetRole || 'Untitled Plan'}</h4>
                      <span className={`badge ${p.shouldApplyNow ? 'badge-success' : 'badge-warning'}`}>
                        {p.shouldApplyNow ? '✅ Apply Now' : '⏳ Upskill First'}
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
                        <div className="flex flex-col gap-2">
                          {missing.map((s: string) => (
                            <div key={s} className="flex items-center justify-between" style={{ background: 'rgba(245, 158, 11, 0.05)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                              <span className="badge badge-warning" style={{ textTransform: 'capitalize' }}>{s}</span>
                              <div className="flex gap-2">
                                <a href={`https://www.google.com/search?q=learn+${encodeURIComponent(s)}+tutorial`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '2px 6px', fontSize: '10px', minHeight: 'auto' }}>
                                  🔍 Google
                                </a>
                                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s)}+tutorial`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '2px 6px', fontSize: '10px', minHeight: 'auto' }}>
                                  🎥 YouTube
                                </a>
                                <a href={`https://www.coursera.org/courses?query=${encodeURIComponent(s)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '2px 6px', fontSize: '10px', minHeight: 'auto' }}>
                                  🎓 Coursera
                                </a>
                              </div>
                            </div>
                          ))}
                          {missing.length === 0 && <span className="text-muted text-xs">No missing skills!</span>}
                        </div>
                      </div>
                    </div>
                    {p.recommendation && <p className="text-sm text-muted mt-3">💡 {p.recommendation}</p>}
                  </div>
                );
              })}
            </div>
          ) : !showCreateGap ? (
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <div className="empty-state-title">No Skill Gap Plans</div>
              <div className="empty-state-text">Compare skills against target roles to identify upskilling needs.</div>
              <button className="btn btn-primary" onClick={() => setShowCreateGap(true)}>Start Analysis</button>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'switch' && (
        <div className="animate-fade-in">
          <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(168,85,247,0.1))', borderColor: 'rgba(139,92,246,0.3)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>🔄 Career Switch Planner</h2>
            <p className="text-muted text-sm">Define target switch parameters and request AI roadmap guidance.</p>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 className="card-title mb-4">Define Your Switch</h3>
              <div className="form-group">
                <label className="form-label">Current Role</label>
                <input className="form-input" value={switchForm.currentRole} onChange={e => setSwitchForm({ ...switchForm, currentRole: e.target.value })} placeholder="e.g. Sales Executive" />
              </div>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <input className="form-input" value={switchForm.targetRole} onChange={e => setSwitchForm({ ...switchForm, targetRole: e.target.value })} placeholder="e.g. Frontend Engineer" />
              </div>
              <div className="form-group">
                <label className="form-label">Switch Mode</label>
                <select className="form-select" value={switchForm.switchMode} onChange={e => setSwitchForm({ ...switchForm, switchMode: e.target.value })}>
                  <option value="adjacent">Adjacent Switch — Related domain</option>
                  <option value="hard">Hard Switch — Completely different domain</option>
                  <option value="dual_track">Dual Track — Search both simultaneously</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Transferable Skills</label>
                <input className="form-input" value={switchForm.transferableSkills} onChange={e => setSwitchForm({ ...switchForm, transferableSkills: e.target.value })} placeholder="Communication, Sales..." />
              </div>
              <div className="form-group">
                <label className="form-label">Missing Skills</label>
                <input className="form-input" value={switchForm.missingSkills} onChange={e => setSwitchForm({ ...switchForm, missingSkills: e.target.value })} placeholder="JavaScript, React..." />
              </div>
              <div className="form-group">
                <label className="form-label">Motivation</label>
                <textarea className="form-textarea" value={switchForm.motivation} onChange={e => setSwitchForm({ ...switchForm, motivation: e.target.value })} placeholder="Why are you switching?" rows={3} />
              </div>
              <button className="btn btn-primary w-full" onClick={analyzeSwitch} disabled={!switchForm.currentRole || !switchForm.targetRole || switchLoading}>
                {switchLoading ? '⏳ Analyzing Switch...' : '🔄 Analyze My Switch'}
              </button>
            </div>

            {switchAnalysis ? (
              <div className="flex flex-col gap-4">
                <div className="card">
                  <h3 className="card-title mb-4">Switch Analysis</h3>
                  <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="stat-card"><div><div className="stat-value">{switchAnalysis.switchScore}</div><div className="stat-label">Switch Score</div></div></div>
                    <div className="stat-card"><div><div className="stat-value">{switchAnalysis.transitionReadiness}%</div><div className="stat-label">Readiness</div></div></div>
                    <div className="stat-card"><div><div className="stat-value">{switchAnalysis.bridgeRolePotential}</div><div className="stat-label">Bridge Potential</div></div></div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title mb-4">Upskilling Milestones</h3>
                  {switchAnalysis.plan7Day?.length > 0 && (
                    <div className="mb-3">
                      <span className="badge badge-info mb-2">Next 7 Days</span>
                      <ul className="text-sm text-muted" style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                        {switchAnalysis.plan7Day.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {switchAnalysis.plan30Day?.length > 0 && (
                    <div className="mb-3">
                      <span className="badge badge-warning mb-2">30-Day Plan</span>
                      <ul className="text-sm text-muted" style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                        {switchAnalysis.plan30Day.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  <button className="btn btn-success mt-4 w-full" onClick={saveSwitchPlan}>
                    {switchSaved ? '✅ Plan Saved!' : '💾 Save Transition Plan'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔄</div>
                <div className="empty-state-title">Ready for Analysis</div>
                <div className="empty-state-text">Provide transition parameters to generate a custom 90-day transition timeline.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
