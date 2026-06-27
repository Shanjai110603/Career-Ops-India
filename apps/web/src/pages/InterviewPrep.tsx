import { useState, useEffect } from 'react';

export default function InterviewPrep() {
  const [preps, setPreps] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPrep, setNewPrep] = useState({ jobTitle: '', company: '' });
  const [generated, setGenerated] = useState<any>(null);

  useEffect(() => { fetch('/api/interview-preps').then(r => r.json()).then(d => setPreps(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const [loading, setLoading] = useState(false);

  const generateQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: newPrep.jobTitle, company: newPrep.company }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setGenerated(data);
    } catch (err: any) {
      alert('Failed to generate questions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePrep = async () => {
    if (!generated) return;
    await fetch('/api/interview-preps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPrep, ...generated }),
    });
    setShowCreate(false);
    setGenerated(null);
    const res = await fetch('/api/interview-preps');
    setPreps(await res.json());
  };

  const renderQuestions = (title: string, questions: string[]) => (
    <div className="mb-6">
      <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>{title}</h4>
      <div className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <div key={i} className="flex gap-3 items-start" style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <span className="text-muted text-xs" style={{ minWidth: 24 }}>Q{i + 1}</span>
            <span className="text-sm">{q}</span>
          </div>
        ))}
      </div>
    </div>
  );

      const [selectedPrepId, setSelectedPrepId] = useState<string | null>(null);

      return (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted text-sm">{preps.length} prep session{preps.length !== 1 ? 's' : ''}</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>🎤 New Interview Prep</button>
          </div>
    
          {showCreate && (
            <div className="card mb-6">
              <h3 className="card-title mb-4">Generate Interview Questions</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input className="form-input" value={newPrep.jobTitle} onChange={e => setNewPrep({ ...newPrep, jobTitle: e.target.value })} placeholder="e.g. Software Engineer" />
                </div>
                <div className="form-group">
                  <label className="form-label">Company *</label>
                  <input className="form-input" value={newPrep.company} onChange={e => setNewPrep({ ...newPrep, company: e.target.value })} placeholder="e.g. Flipkart" />
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn btn-primary" onClick={generateQuestions} disabled={!newPrep.jobTitle || !newPrep.company || loading}>
                  {loading ? '⏳ Generating...' : '🎯 Generate Questions'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowCreate(false); setGenerated(null); }}>Cancel</button>
              </div>
    
              {generated && (
                <div className="mt-6">
                  {renderQuestions('💼 HR / Behavioral Questions', generated.hrQuestions)}
                  {renderQuestions('🎯 Role-Specific Questions', generated.roleQuestions)}
                  {renderQuestions('💰 Salary & Negotiation', generated.salaryQuestions)}
                  {renderQuestions('🔄 Career Switch Questions', generated.switchQuestions)}
                  {renderQuestions('⏰ Notice Period Questions', generated.noticePeriodQuestions)}
                  <button className="btn btn-primary" onClick={savePrep}>💾 Save Prep Session</button>
                </div>
              )}
            </div>
          )}
    
          {preps.length > 0 ? (
            <div className="flex flex-col gap-4">
              {preps.map((p: any) => {
                const isOpen = selectedPrepId === p.id;
                let hr: string[] = [];
                let role: string[] = [];
                let salary: string[] = [];
                let sw: string[] = [];
                let np: string[] = [];
                try { hr = typeof p.hrQuestions === 'string' ? JSON.parse(p.hrQuestions) : p.hrQuestions || []; } catch {}
                try { role = typeof p.roleQuestions === 'string' ? JSON.parse(p.roleQuestions) : p.roleQuestions || []; } catch {}
                try { salary = typeof p.salaryQuestions === 'string' ? JSON.parse(p.salaryQuestions) : p.salaryQuestions || []; } catch {}
                try { sw = typeof p.switchQuestions === 'string' ? JSON.parse(p.switchQuestions) : p.switchQuestions || []; } catch {}
                try { np = typeof p.noticePeriodQuestions === 'string' ? JSON.parse(p.noticePeriodQuestions) : p.noticePeriodQuestions || []; } catch {}

                return (
                  <div key={p.id} className="card" style={{ padding: 'var(--space-5)', cursor: 'pointer' }} onClick={() => setSelectedPrepId(isOpen ? null : p.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 style={{ fontWeight: 600 }}>{p.jobTitle}</h4>
                        <p className="text-muted text-sm">{p.company}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : ''}</span>
                        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: '0.8rem' }}>▼</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                        {hr.length > 0 && renderQuestions('💼 HR / Behavioral Questions', hr)}
                        {role.length > 0 && renderQuestions('🎯 Role-Specific Questions', role)}
                        {salary.length > 0 && renderQuestions('💰 Salary & Negotiation', salary)}
                        {sw.length > 0 && renderQuestions('🔄 Career Switch Questions', sw)}
                        {np.length > 0 && renderQuestions('⏰ Notice Period Questions', np)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : !showCreate ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎤</div>
              <div className="empty-state-title">No Interview Preps</div>
              <div className="empty-state-text">Generate role-specific interview questions to prepare for your next interview.</div>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Start Preparing</button>
            </div>
          ) : null}
        </div>
      );
    }
