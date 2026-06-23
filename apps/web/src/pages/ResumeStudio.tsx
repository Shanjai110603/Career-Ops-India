import { useState, useEffect } from 'react';

export default function ResumeStudio() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newResume, setNewResume] = useState({
    name: '', type: 'master', template: 'modern', format: 'one_page',
    sections: {
      personalInfo: { name: '', email: '', phone: '', location: '', linkedin: '' },
      summary: '',
      experience: [{ title: '', company: '', duration: '', description: '' }],
      education: [{ degree: '', institution: '', year: '' }],
      skills: [''],
      projects: [{ name: '', description: '', tech: '' }],
      certifications: [''],
    }
  });

  const loadResumes = () => {
    fetch('/api/resumes').then(r => r.json()).then(d => setResumes(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { loadResumes(); }, []);

  const saveResume = async () => {
    await fetch('/api/resumes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newResume),
    });
    setShowCreate(false);
    loadResumes();
  };

  const updateSection = (path: string, value: any) => {
    setNewResume(prev => {
      const sections = { ...prev.sections } as any;
      const keys = path.split('.');
      let obj = sections;
      for (let i = 0; i < keys.length - 1; i++) {
        if (Array.isArray(obj[keys[i]])) {
          obj = obj[keys[i]];
        } else {
          obj = obj[keys[i]] = { ...obj[keys[i]] };
        }
      }
      obj[keys[keys.length - 1]] = value;
      return { ...prev, sections };
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{resumes.length} resume{resumes.length !== 1 ? 's' : ''} created</p>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>📝 Create New Resume</button>
      </div>

      {/* Resume List */}
      {resumes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
          {resumes.map((r: any) => {
            let sections: any = {};
            try { sections = typeof r.sections === 'string' ? JSON.parse(r.sections) : r.sections; } catch {}
            return (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h4 style={{ fontWeight: 600 }}>{r.name}</h4>
                  <span className="badge badge-info">{r.type}</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <span className="badge badge-neutral">{r.template}</span>
                  <span className="badge badge-neutral">{(r.format || '').replace(/_/g, ' ')}</span>
                  <span className="badge badge-neutral">v{r.version}</span>
                </div>
                {sections.personalInfo?.name && <p className="text-sm text-muted">{sections.personalInfo.name}</p>}
                <p className="text-xs text-muted mt-2">Updated: {r.updated_at ? new Date(r.updated_at).toLocaleDateString('en-IN') : 'N/A'}</p>
              </div>
            );
          })}
        </div>
      ) : !showCreate ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No Resumes Yet</div>
          <div className="empty-state-text">Create your master resume and generate role-specific versions.</div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Your First Resume</button>
        </div>
      ) : null}

      {/* Create Resume Form */}
      {showCreate && (
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Create Resume</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕ Close</button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Resume Name *</label>
              <input className="form-input" value={newResume.name} onChange={e => setNewResume({ ...newResume, name: e.target.value })} placeholder="e.g. Master Resume 2025" />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={newResume.type} onChange={e => setNewResume({ ...newResume, type: e.target.value })}>
                <option value="master">Master Resume</option>
                <option value="role_specific">Role-Specific</option>
                <option value="career_switch">Career Switch</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Template</label>
              <select className="form-select" value={newResume.template} onChange={e => setNewResume({ ...newResume, template: e.target.value })}>
                <option value="modern">Modern (ATS-Friendly)</option>
                <option value="classic">Classic Indian</option>
                <option value="minimal">Minimal One-Page</option>
                <option value="career_switch">Career Switch Narrative</option>
              </select>
            </div>
          </div>

          <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', marginTop: 'var(--space-4)' }}>Personal Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={newResume.sections.personalInfo.name} onChange={e => updateSection('personalInfo.name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={newResume.sections.personalInfo.email} onChange={e => updateSection('personalInfo.email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={newResume.sections.personalInfo.phone} onChange={e => updateSection('personalInfo.phone', e.target.value)} placeholder="+91..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={newResume.sections.personalInfo.location} onChange={e => updateSection('personalInfo.location', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn URL</label>
              <input className="form-input" value={newResume.sections.personalInfo.linkedin} onChange={e => updateSection('personalInfo.linkedin', e.target.value)} />
            </div>
          </div>

          <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', marginTop: 'var(--space-4)' }}>Professional Summary</h4>
          <div className="form-group">
            <textarea className="form-textarea" value={newResume.sections.summary} onChange={e => updateSection('summary', e.target.value)} rows={4} placeholder="A concise 2-3 sentence summary of your professional background, key strengths, and career objectives..." />
          </div>

          <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', marginTop: 'var(--space-4)' }}>Skills</h4>
          <div className="form-group">
            <input className="form-input" value={newResume.sections.skills.join(', ')} onChange={e => updateSection('skills', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="JavaScript, Python, SQL, Excel, Communication..." />
            <span className="form-hint">Comma-separated list of skills</span>
          </div>

          <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', marginTop: 'var(--space-4)' }}>Experience</h4>
          {newResume.sections.experience.map((exp, i) => (
            <div key={i} className="card mb-4" style={{ padding: 'var(--space-4)' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input className="form-input" value={exp.title} onChange={e => {
                    const exps = [...newResume.sections.experience];
                    exps[i] = { ...exps[i], title: e.target.value };
                    updateSection('experience', exps);
                  }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-input" value={exp.company} onChange={e => {
                    const exps = [...newResume.sections.experience];
                    exps[i] = { ...exps[i], company: e.target.value };
                    updateSection('experience', exps);
                  }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input className="form-input" value={exp.duration} onChange={e => {
                    const exps = [...newResume.sections.experience];
                    exps[i] = { ...exps[i], duration: e.target.value };
                    updateSection('experience', exps);
                  }} placeholder="Jan 2023 - Present" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description / Achievements</label>
                <textarea className="form-textarea" value={exp.description} onChange={e => {
                  const exps = [...newResume.sections.experience];
                  exps[i] = { ...exps[i], description: e.target.value };
                  updateSection('experience', exps);
                }} rows={3} placeholder="• Led a team of 5 engineers...&#10;• Improved API performance by 40%..." />
              </div>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => updateSection('experience', [...newResume.sections.experience, { title: '', company: '', duration: '', description: '' }])}>
            ➕ Add Experience
          </button>

          <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', marginTop: 'var(--space-4)' }}>Education</h4>
          {newResume.sections.education.map((edu, i) => (
            <div key={i} className="form-row">
              <div className="form-group">
                <label className="form-label">Degree</label>
                <input className="form-input" value={edu.degree} onChange={e => {
                  const edus = [...newResume.sections.education];
                  edus[i] = { ...edus[i], degree: e.target.value };
                  updateSection('education', edus);
                }} placeholder="B.Tech in Computer Science" />
              </div>
              <div className="form-group">
                <label className="form-label">Institution</label>
                <input className="form-input" value={edu.institution} onChange={e => {
                  const edus = [...newResume.sections.education];
                  edus[i] = { ...edus[i], institution: e.target.value };
                  updateSection('education', edus);
                }} />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" value={edu.year} onChange={e => {
                  const edus = [...newResume.sections.education];
                  edus[i] = { ...edus[i], year: e.target.value };
                  updateSection('education', edus);
                }} placeholder="2024" />
              </div>
            </div>
          ))}

          <div className="flex gap-3 mt-6" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveResume} disabled={!newResume.name}>💾 Save Resume</button>
          </div>
        </div>
      )}
    </div>
  );
}
