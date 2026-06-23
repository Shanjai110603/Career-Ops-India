import { useState, useEffect } from 'react';

export default function InterviewPrep() {
  const [preps, setPreps] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPrep, setNewPrep] = useState({ jobTitle: '', company: '' });
  const [generated, setGenerated] = useState<any>(null);

  useEffect(() => { fetch('/api/interview-preps').then(r => r.json()).then(d => setPreps(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const generateQuestions = () => {
    const title = newPrep.jobTitle.toLowerCase();
    setGenerated({
      hrQuestions: [
        'Tell me about yourself and your career journey.',
        'Why are you interested in this role at ' + newPrep.company + '?',
        'Where do you see yourself in 5 years?',
        'What are your salary expectations?',
        'What is your notice period? Can it be negotiated?',
        'Why are you leaving your current organization?',
        'Tell me about a time you handled a difficult team situation.',
        'How do you handle work pressure and tight deadlines?',
      ],
      roleQuestions: title.includes('software') || title.includes('developer') || title.includes('engineer') ? [
        'Explain the difference between REST and GraphQL APIs.',
        'How would you design a scalable microservices architecture?',
        'Describe your experience with CI/CD pipelines.',
        'Walk me through your approach to debugging a production issue.',
        'What design patterns do you commonly use?',
        'How do you ensure code quality in your projects?',
      ] : title.includes('data') || title.includes('analyst') ? [
        'Explain the difference between INNER JOIN and LEFT JOIN.',
        'How would you clean and prepare a messy dataset?',
        'Describe your experience with data visualization tools.',
        'What metrics would you track for an e-commerce platform?',
        'Explain the concept of A/B testing and when to use it.',
        'Walk through your approach to exploratory data analysis.',
      ] : title.includes('product') ? [
        'How would you prioritize features for a new product launch?',
        'Describe a product you admire and explain why.',
        'How do you measure product success?',
        'Walk me through how you would improve an existing feature.',
        'How do you handle conflicting stakeholder requirements?',
        'Describe your experience with user research methodologies.',
      ] : [
        'Describe your experience relevant to this role.',
        'What specific skills make you suitable for this position?',
        'How do you stay updated in your field?',
        'Describe a project where you delivered measurable results.',
        'How do you approach problem-solving in your work?',
        'What tools and technologies are you proficient with?',
      ],
      salaryQuestions: [
        'What is your current CTC and expected CTC?',
        'Are you open to negotiation on the offered package?',
        'Do you have any other offers currently?',
        'What components are most important to you in compensation?',
      ],
      switchQuestions: [
        'Why are you switching from your current domain?',
        'How will your previous experience benefit this role?',
        'What steps have you taken to prepare for this transition?',
        'Are you willing to start at a junior level in the new domain?',
      ],
      noticePeriodQuestions: [
        'What is your current notice period?',
        'Can you negotiate an early release?',
        'Would you be able to join immediately if required?',
        'Are you currently serving notice?',
      ],
    });
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
            <button className="btn btn-primary" onClick={generateQuestions} disabled={!newPrep.jobTitle || !newPrep.company}>🎯 Generate Questions</button>
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
          {preps.map((p: any) => (
            <div key={p.id} className="card" style={{ padding: 'var(--space-5)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 style={{ fontWeight: 600 }}>{p.job_title}</h4>
                  <p className="text-muted text-sm">{p.company}</p>
                </div>
                <span className="text-xs text-muted">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : ''}</span>
              </div>
            </div>
          ))}
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
