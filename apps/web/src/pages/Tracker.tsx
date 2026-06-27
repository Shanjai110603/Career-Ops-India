import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Tracker() {
  const [apps, setApps] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApp, setNewApp] = useState({ company: '', jobTitle: '', status: 'discovered', location: '', workMode: '', salaryText: '', notes: '' });

  // Resume tailoring states
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tailoring, setTailoring] = useState(false);

  const loadApps = () => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    fetch(`/api/applications${params}`).then(r => r.json()).then(d => setApps(Array.isArray(d) ? d : [])).catch(() => setApps([]));
  };

  useEffect(() => { loadApps(); }, [filter]);

  const openTailorModal = async (app: any) => {
    setSelectedApp(app);
    setJobDescription('');
    setSelectedResumeId('');
    setShowTailorModal(true);

    // Fetch master resumes
    try {
      const res = await fetch('/api/resumes');
      const data = await res.json();
      const masters = data.filter((r: any) => r.type === 'master');
      setResumes(masters);
      if (masters.length > 0) {
        setSelectedResumeId(masters[0].id);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    }

    // Prefill job description if jobId exists
    if (app.jobId) {
      try {
        const jobRes = await fetch(`/api/jobs/${app.jobId}`);
        const jobData = await jobRes.json();
        if (jobData && jobData.description) {
          setJobDescription(jobData.description);
        }
      } catch (err) {
        console.error('Failed to fetch job description:', err);
      }
    }
  };

  const handleTailorResume = async () => {
    if (!selectedResumeId || !selectedApp) return;
    setTailoring(true);
    try {
      const res = await fetch(`/api/resumes/${selectedResumeId}/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          company: selectedApp.company,
          jobTitle: selectedApp.jobTitle,
          jobId: selectedApp.jobId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Link resume to application and move status to resume_tailored
      await fetch(`/api/applications/${selectedApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeVersionId: data.id,
          status: 'resume_tailored'
        }),
      });

      alert('Resume tailored successfully and linked to application!');
      setShowTailorModal(false);
      loadApps();
    } catch (err: any) {
      alert('Tailoring failed: ' + err.message);
    } finally {
      setTailoring(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadApps();
  };

  const addApp = async () => {
    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp),
    });
    setShowAddModal(false);
    setNewApp({ company: '', jobTitle: '', status: 'discovered', location: '', workMode: '', salaryText: '', notes: '' });
    loadApps();
  };

  const statusGroups = [
    { id: 'all', label: 'All' },
    { id: 'discovered', label: '🔍 Discovered' },
    { id: 'saved', label: '💾 Saved' },
    { id: 'shortlisted', label: '⭐ Shortlisted' },
    { id: 'resume_tailored', label: '📝 Resume Tailored' },
    { id: 'applied', label: '📤 Applied' },
    { id: 'assessment_pending', label: '📋 Assessment' },
    { id: 'interview_scheduled', label: '📅 Interview' },
    { id: 'hr_round', label: '💼 HR Round' },
    { id: 'technical_round', label: '💻 Tech Round' },
    { id: 'manager_round', label: '👔 Manager Round' },
    { id: 'offer_received', label: '🎉 Offer' },
    { id: 'accepted', label: '✅ Accepted' },
    { id: 'rejected', label: '❌ Rejected' },
    { id: 'no_response', label: '😶 No Response' },
    { id: 'follow_up_due', label: '⏰ Follow-up' },
    { id: 'archived', label: '📦 Archived' },
  ];

  const statusColors: Record<string, string> = {
    discovered: '#64748b', saved: '#6366f1', shortlisted: '#8b5cf6', resume_tailored: '#a855f7',
    applied: '#3b82f6', assessment_pending: '#f59e0b', interview_scheduled: '#f97316',
    hr_round: '#ec4899', technical_round: '#14b8a6', manager_round: '#06b6d4',
    offer_received: '#22c55e', accepted: '#10b981', rejected: '#ef4444',
    no_response: '#9ca3af', follow_up_due: '#eab308', archived: '#6b7280',
  };

  const nextStatuses: Record<string, string[]> = {
    discovered: ['saved', 'archived'], saved: ['shortlisted', 'archived'],
    shortlisted: ['resume_tailored', 'applied'], resume_tailored: ['applied'],
    applied: ['assessment_pending', 'interview_scheduled', 'hr_round', 'rejected', 'no_response'],
    assessment_pending: ['interview_scheduled', 'rejected'], interview_scheduled: ['hr_round', 'technical_round', 'rejected'],
    hr_round: ['technical_round', 'manager_round', 'offer_received', 'rejected'],
    technical_round: ['manager_round', 'offer_received', 'rejected'],
    manager_round: ['offer_received', 'rejected'], offer_received: ['accepted', 'rejected'],
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted text-sm">{apps.length} application{apps.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>➕ Add Application</button>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        {statusGroups.map(s => (
          <button key={s.id} className={`btn btn-sm ${filter === s.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      {apps.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Status</th>
                <th>Location</th>
                <th>Salary</th>
                <th>Score</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
               {apps.map((app: any) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 500 }}>{app.jobTitle}</td>
                  <td>{app.company}</td>
                  <td>
                    <span className="badge" style={{ background: (statusColors[app.status] || '#64748b') + '22', color: statusColors[app.status] || '#64748b' }}>
                      {(app.status || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{app.location || '—'}</td>
                  <td className="text-sm">{app.salaryText || '—'}</td>
                  <td>{app.fitScore ? <span className="badge badge-info">{Math.round(app.fitScore)}</span> : '—'}</td>
                  <td className="text-muted text-xs" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.notes || '—'}</td>
                  <td>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      {(nextStatuses[app.status] || []).slice(0, 2).map(ns => (
                        <button key={ns} className="btn btn-ghost btn-sm" onClick={() => updateStatus(app.id, ns)} title={`Move to ${ns.replace(/_/g, ' ')}`}>
                          → {ns.replace(/_/g, ' ').slice(0, 10)}
                        </button>
                      ))}
                      {['discovered', 'saved', 'shortlisted'].includes(app.status) && (
                        <button className="btn btn-secondary btn-sm" onClick={() => openTailorModal(app)} title="Tailor Resume for this Job">
                          📝 Tailor CV
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No Applications Yet</div>
          <div className="empty-state-text">Start tracking your job applications by adding them here or saving jobs from search results.</div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>Add Your First Application</button>
        </div>
      )}

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Track New Application</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input className="form-input" value={newApp.jobTitle} onChange={e => setNewApp({ ...newApp, jobTitle: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Company *</label>
                <input className="form-input" value={newApp.company} onChange={e => setNewApp({ ...newApp, company: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={newApp.status} onChange={e => setNewApp({ ...newApp, status: e.target.value })}>
                  {statusGroups.filter(s => s.id !== 'all').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={newApp.location} onChange={e => setNewApp({ ...newApp, location: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Work Mode</label>
                <select className="form-select" value={newApp.workMode} onChange={e => setNewApp({ ...newApp, workMode: e.target.value })}>
                  <option value="">Select</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                  <option value="wfh">WFH</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Salary</label>
                <input className="form-input" value={newApp.salaryText} onChange={e => setNewApp({ ...newApp, salaryText: e.target.value })} placeholder="e.g. 8-12 LPA" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={newApp.notes} onChange={e => setNewApp({ ...newApp, notes: e.target.value })} rows={3} />
            </div>
            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addApp} disabled={!newApp.jobTitle || !newApp.company}>Track Application</button>
            </div>
          </div>
        </div>
      )}

      {/* Tailor Resume Modal */}
      {showTailorModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTailorModal(false)}>
          <div className="modal" style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h3 className="modal-title">Tailor Resume for {selectedApp?.company}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTailorModal(false)}>✕</button>
            </div>
            
            {resumes.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-4)' }}>
                <p className="text-sm mb-4">You do not have any Master Resumes created. Please create a Master Resume in the Resume Studio first.</p>
                <Link to="/resume" className="btn btn-primary">Go to Resume Studio</Link>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Select Base Master Resume</label>
                  <select className="form-select" value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)}>
                    {resumes.map(r => <option key={r.id} value={r.id}>{r.name} (v{r.version})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Role / Job Title</label>
                  <input className="form-input" value={selectedApp?.jobTitle || ''} readOnly />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Company</label>
                  <input className="form-input" value={selectedApp?.company || ''} readOnly />
                </div>

                <div className="form-group">
                  <label className="form-label">Job Description (used for keyword matching and narrative alignment)</label>
                  <textarea 
                    className="form-textarea" 
                    value={jobDescription} 
                    onChange={e => setJobDescription(e.target.value)} 
                    placeholder="Paste the target job description here. If this app is linked to a scraped job listing, this is prefilled automatically." 
                    rows={8} 
                  />
                </div>

                <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowTailorModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleTailorResume} disabled={tailoring || !jobDescription}>
                    {tailoring ? '⏳ Tailoring CV via AI...' : '🎯 Run Resume Tailoring'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
