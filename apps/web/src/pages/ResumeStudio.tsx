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

  // Tailoring states
  const [showTailor, setShowTailor] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [tailorForm, setTailorForm] = useState({ company: '', jobTitle: '', jobDescription: '' });
  const [tailoring, setTailoring] = useState(false);

  // Preview / Export states
  const [showPreview, setShowPreview] = useState(false);
  const [previewResume, setPreviewResume] = useState<any>(null);

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const compileToMarkdown = (resume: any) => {
    let sections: any = {};
    try { sections = typeof resume.sections === 'string' ? JSON.parse(resume.sections) : resume.sections || {}; } catch {}
    const p = sections.personalInfo || {};
    
    let md = `# ${p.name || 'Resume'}\n\n`;
    if (p.email || p.phone || p.location || p.linkedin) {
      const parts = [
        p.email ? `Email: ${p.email}` : null,
        p.phone ? `Phone: ${p.phone}` : null,
        p.location ? `Location: ${p.location}` : null,
        p.linkedin ? `LinkedIn: ${p.linkedin}` : null
      ].filter(Boolean);
      md += parts.join(' | ') + '\n\n';
    }
    
    if (sections.summary) {
      md += `## Professional Summary\n${sections.summary}\n\n`;
    }
    
    if (sections.skills && sections.skills.length > 0) {
      md += `## Skills\n${sections.skills.join(', ')}\n\n`;
    }
    
    if (sections.experience && sections.experience.length > 0) {
      md += `## Work Experience\n\n`;
      sections.experience.forEach((e: any) => {
        md += `### ${e.title} — ${e.company}\n*${e.duration || ''}*\n${e.description || ''}\n\n`;
      });
    }
    
    if (sections.education && sections.education.length > 0) {
      md += `## Education\n\n`;
      sections.education.forEach((e: any) => {
        md += `**${e.degree}** — ${e.institution} (${e.year || ''})\n\n`;
      });
    }
    return md;
  };

  const compileToHTML = (resume: any) => {
    let sections: any = {};
    try { sections = typeof resume.sections === 'string' ? JSON.parse(resume.sections) : resume.sections || {}; } catch {}
    const p = sections.personalInfo || {};
    
    let expHTML = '';
    if (sections.experience && sections.experience.length > 0) {
      expHTML = sections.experience.map((e: any) => `
        <div class="exp-item">
          <span class="duration">${e.duration || ''}</span>
          <h3>${e.title} at <span class="company">${e.company}</span></h3>
          <p style="font-size: 14px; margin-top: 5px; white-space: pre-line;">${e.description || ''}</p>
        </div>
      `).join('');
    }

    let eduHTML = '';
    if (sections.education && sections.education.length > 0) {
      eduHTML = sections.education.map((e: any) => `
        <div style="margin-bottom: 10px;">
          <span class="duration">${e.year || ''}</span>
          <h3 style="font-weight: 500;">${e.degree}</h3>
          <p style="font-size: 13px; color: #64748b; margin-top: 2px;">${e.institution}</p>
        </div>
      `).join('');
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${resume.name || 'Resume'}</title>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1e293b; line-height: 1.6; }
    h1 { font-size: 32px; margin-bottom: 5px; color: #0f172a; text-align: center; }
    .contact-info { text-align: center; font-size: 14px; color: #64748b; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    h2 { font-size: 18px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.05em; }
    h3 { font-size: 15px; margin-bottom: 2px; color: #1e293b; }
    .company { font-weight: bold; color: #4f46e5; }
    .duration { font-style: italic; color: #64748b; font-size: 13px; float: right; }
    .exp-item { margin-bottom: 15px; clear: both; }
    .skills-list { font-size: 14px; }
    @media print {
      body { margin: 0; padding: 0; }
      @page { size: A4; margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <h1>${p.name || 'Resume'}</h1>
  <div class="contact-info">
    ${p.email ? `${p.email} &bull; ` : ''}
    ${p.phone ? `${p.phone} &bull; ` : ''}
    ${p.location ? `${p.location} &bull; ` : ''}
    ${p.linkedin ? `${p.linkedin}` : ''}
  </div>
  
  ${sections.summary ? `<h2>Professional Summary</h2><p style="font-size: 14px;">${sections.summary}</p>` : ''}
  
  ${sections.skills && sections.skills.length > 0 ? `
    <h2>Skills</h2>
    <p class="skills-list">${sections.skills.join(', ')}</p>
  ` : ''}
  
  ${expHTML ? `<h2>Work Experience</h2>${expHTML}` : ''}
  
  ${eduHTML ? `<h2>Education</h2>${eduHTML}` : ''}
</body>
</html>`;
  };

  const handleExportJSON = (resume: any) => {
    let sections: any = {};
    try { sections = typeof resume.sections === 'string' ? JSON.parse(resume.sections) : resume.sections || {}; } catch {}
    downloadFile(JSON.stringify(sections, null, 2), `${resume.name.toLowerCase().replace(/\s+/g, '_')}.json`, 'application/json');
  };

  const handleExportMarkdown = (resume: any) => {
    const md = compileToMarkdown(resume);
    downloadFile(md, `${resume.name.toLowerCase().replace(/\s+/g, '_')}.md`, 'text/markdown');
  };

  const handleExportHTML = (resume: any) => {
    const html = compileToHTML(resume);
    downloadFile(html, `${resume.name.toLowerCase().replace(/\s+/g, '_')}.html`, 'text/html');
  };

  const loadResumes = () => {
    fetch('/api/resumes').then(r => r.json()).then(d => setResumes(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { loadResumes(); }, []);

  const handleTailor = async () => {
    if (!selectedResume) return;
    setTailoring(true);
    try {
      const res = await fetch(`/api/resumes/${selectedResume.id}/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tailorForm),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Resume tailored successfully!');
      setShowTailor(false);
      setTailorForm({ company: '', jobTitle: '', jobDescription: '' });
      loadResumes();
    } catch (err: any) {
      alert('Tailoring failed: ' + err.message);
    } finally {
      setTailoring(false);
    }
  };

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
                <p className="text-xs text-muted mt-2">Updated: {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('en-IN') : 'N/A'}</p>
                <div className="flex gap-2 mt-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setPreviewResume(r); setShowPreview(true); }}>
                    👁️ Preview
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleExportHTML(r)} title="Export styled HTML resume">
                    📥 HTML
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleExportMarkdown(r)} title="Export Markdown raw file">
                    📥 MD
                  </button>
                  {r.type === 'master' && (
                    <button className="btn btn-primary btn-sm" onClick={() => { setSelectedResume(r); setShowTailor(true); }}>
                      🎯 Tailor
                    </button>
                  )}
                </div>
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

      {/* Tailor Resume Modal */}
      {showTailor && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTailor(false)}>
          <div className="modal" style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h3 className="modal-title">Tailor Resume: {selectedResume?.name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTailor(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Target Company *</label>
              <input className="form-input" value={tailorForm.company} onChange={e => setTailorForm({ ...tailorForm, company: e.target.value })} placeholder="e.g. Razorpay" />
            </div>

            <div className="form-group">
              <label className="form-label">Target Job Title *</label>
              <input className="form-input" value={tailorForm.jobTitle} onChange={e => setTailorForm({ ...tailorForm, jobTitle: e.target.value })} placeholder="e.g. Frontend Engineer" />
            </div>

            <div className="form-group">
              <label className="form-label">Job Description *</label>
              <textarea 
                className="form-textarea" 
                value={tailorForm.jobDescription} 
                onChange={e => setTailorForm({ ...tailorForm, jobDescription: e.target.value })} 
                placeholder="Paste the target job description here..." 
                rows={8} 
              />
            </div>

            <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowTailor(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleTailor} disabled={tailoring || !tailorForm.company || !tailorForm.jobTitle || !tailorForm.jobDescription}>
                {tailoring ? '⏳ Tailoring CV via AI...' : '🎯 Run Resume Tailoring'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Resume Modal */}
      {showPreview && previewResume && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPreview(false)}>
          <div className="modal" style={{ maxWidth: 850, width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title">👁️ Resume Preview: {previewResume.name}</h3>
              <div className="flex gap-2" style={{ marginLeft: 'auto', marginRight: 'var(--space-2)' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  const win = window.open('', '_blank');
                  if (win) {
                    win.document.write(compileToHTML(previewResume));
                    win.document.close();
                    win.print();
                  }
                }}>
                  🖨️ Print
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleExportJSON(previewResume)}>
                  📥 JSON
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleExportHTML(previewResume)}>
                  📥 HTML
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleExportMarkdown(previewResume)}>
                  📥 MD
                </button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', color: '#1e293b', borderRadius: 'var(--radius-md)', padding: '30px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
              <div dangerouslySetInnerHTML={{ 
                __html: compileToHTML(previewResume)
                  .replace(/<!DOCTYPE html>[\s\S]*?<body>/, '')
                  .replace(/<\/body>[\s\S]*?<\/html>/, '')
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
