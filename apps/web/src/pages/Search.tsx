import { useState, useEffect } from 'react';

export default function Search() {
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  
  // Search state
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [experience, setExperience] = useState('');
  const [sort, setSort] = useState('date');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', description: '', location: '', workMode: '', salaryText: '', salaryMinLPA: '', salaryMaxLPA: '', experienceMin: '', experienceMax: '', source: 'manual', sourceUrl: '' });
  const [cities, setCities] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Saved Jobs state
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/jobs/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      alert(`Scan complete! Found ${data.totalFetched} jobs, saved ${data.savedCount} new ones.${data.errors?.length ? '\nErrors: ' + data.errors.join(', ') : ''}`);
      handleSearch();
    } catch (err: any) {
      alert('Scan failed: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetch('/api/jobs?limit=30').then(r => r.json()).then(j => setResults(Array.isArray(j) ? j : [])).catch(() => {});
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (location) params.set('location', location);
    if (workMode) params.set('workMode', workMode);
    if (minSalary) params.set('minSalary', minSalary);
    if (maxSalary) params.set('maxSalary', maxSalary);
    if (experience) params.set('experience', experience);
    if (sort) params.set('sort', sort);
    params.set('limit', '50');

    try {
      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Saved opportunity functions
  const fetchSavedJobs = async () => {
    setSavedLoading(true);
    try {
      const res = await fetch('/api/applications?status=saved');
      const d = await res.json();
      setSavedJobs(Array.isArray(d) ? d : []);
    } catch {
      setSavedJobs([]);
    } finally {
      setSavedLoading(false);
    }
  };

  const moveToStatus = async (id: string, status: string) => {
    await fetch(`/api/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSavedJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: newJob.title,
      company: newJob.company,
      description: newJob.description,
      location: newJob.location,
      workMode: newJob.workMode || 'onsite',
      salaryText: newJob.salaryText || null,
      salaryMinLPA: newJob.salaryMinLPA ? parseFloat(newJob.salaryMinLPA) : null,
      salaryMaxLPA: newJob.salaryMaxLPA ? parseFloat(newJob.salaryMaxLPA) : null,
      experienceMin: newJob.experienceMin ? parseFloat(newJob.experienceMin) : null,
      experienceMax: newJob.experienceMax ? parseFloat(newJob.experienceMax) : null,
      source: newJob.source || 'manual',
      sourceUrl: newJob.sourceUrl || null,
    };

    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setShowAddModal(false);
    setNewJob({ title: '', company: '', description: '', location: '', workMode: '', salaryText: '', salaryMinLPA: '', salaryMaxLPA: '', experienceMin: '', experienceMax: '', source: 'manual', sourceUrl: '' });
    handleSearch();
  };

  const handleSaveJob = async (job: any) => {
    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, company: job.company, jobTitle: job.title, status: 'saved', location: job.location, workMode: job.workMode, salaryText: job.salaryText }),
    });
    alert('Job saved to tracker!');
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Delete this job listing?')) return;
    await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
    setResults(prev => prev.filter(j => j.id !== jobId));
  };

  const handleClearAllJobs = async () => {
    if (!confirm(`Delete all ${results.length} jobs? This cannot be undone.`)) return;
    for (const j of results) {
      await fetch(`/api/jobs/${j.id}`, { method: 'DELETE' });
    }
    setResults([]);
  };

  const searchLocations = async (q: string) => {
    if (q.length < 2) return;
    const res = await fetch(`/api/locations/cities?search=${q}`);
    const data = await res.json();
    setCities(Array.isArray(data) ? data : []);
  };

  const gradeClass = (grade: string) => {
    if (!grade) return 'badge-neutral';
    if (grade.startsWith('A')) return 'grade-a';
    if (grade.startsWith('B')) return 'grade-b';
    if (grade.startsWith('C')) return 'grade-c';
    if (grade.startsWith('D')) return 'grade-d';
    return 'grade-f';
  };

  const formatSalary = (job: any) => {
    if (job.salaryMinLPA && job.salaryMaxLPA) return `₹${job.salaryMinLPA}L - ₹${job.salaryMaxLPA}L`;
    if (job.salaryMinLPA) return `₹${job.salaryMinLPA}L+`;
    if (job.salaryText) return job.salaryText.replace(/\?1/g, '₹');
    return null;
  };

  const formatExp = (job: any) => {
    if (job.experienceMin != null && job.experienceMax != null) return `${job.experienceMin}-${job.experienceMax} yrs`;
    if (job.experienceMin != null) return `${job.experienceMin}+ yrs`;
    return null;
  };

  const cleanTitle = (title: string) => {
    if (!title) return title;
    if (!title.includes(' ') && title.length > 15) {
      return title.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    }
    return title;
  };

  return (
    <div className="animate-fade-in">
      {/* Navigation tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
          🔍 Search & Discovery
        </button>
        <button className={`tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => { setActiveTab('saved'); fetchSavedJobs(); }}>
          💾 Saved Inbox ({results.filter(r => r.source === 'saved').length || savedJobs.length})
        </button>
      </div>

      {activeTab === 'search' ? (
        <>
          {/* Search Builder */}
          <div className="card mb-6">
            <h3 className="card-title mb-4">🔍 Universal Job Search Builder</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Search Keywords</label>
                <input className="form-input" placeholder="Job title, skill, company..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="City, state, or region..." value={location} onChange={e => { setLocation(e.target.value); searchLocations(e.target.value); }} list="city-suggestions" />
                <datalist id="city-suggestions">
                  {cities.map((c: any) => <option key={c.name} value={c.name}>{c.name}, {c.stateCode}</option>)}
                </datalist>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Work Mode</label>
                <select className="form-select" value={workMode} onChange={e => setWorkMode(e.target.value)}>
                  <option value="">All Work Modes</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site / WFO</option>
                  <option value="wfh">Work from Home</option>
                  <option value="india_remote">Remote (India)</option>
                  <option value="international_remote">Remote (International)</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                  <option value="part_time">Part-time</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="field_role">Field Role</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Salary Range (LPA)</label>
                <div className="flex gap-2">
                  <input className="form-input" type="number" placeholder="Min" value={minSalary} onChange={e => setMinSalary(e.target.value)} />
                  <input className="form-input" type="number" placeholder="Max" value={maxSalary} onChange={e => setMaxSalary(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Experience</label>
                <select className="form-select" value={experience} onChange={e => setExperience(e.target.value)}>
                  <option value="">All Levels</option>
                  <option value="fresher">Fresher</option>
                  <option value="0-1">0–1 Year</option>
                  <option value="1-3">1–3 Years</option>
                  <option value="3-5">3–5 Years</option>
                  <option value="5-10">5–10 Years</option>
                  <option value="10+">10+ Years</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sort By</label>
                <select className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="date">Newest First</option>
                  <option value="score">Best Match</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                {loading ? '⏳ Searching...' : '🔍 Search Jobs'}
              </button>
              <button className="btn btn-secondary" onClick={handleScan} disabled={scanning}>
                {scanning ? '⏳ Scanning Portals...' : '🌐 Scan Portals'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(true)}>
                ➕ Add Job Manually
              </button>
              {results.length > 0 && (
                <button className="btn btn-danger" onClick={handleClearAllJobs} style={{ marginLeft: 'auto' }}>
                  🗑️ Clear All
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
              {results.length > 0 ? `${results.length} Jobs Found` : 'No jobs yet'}
            </h3>
          </div>

          {(loading || scanning) ? (
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: '10px', animation: 'pulse 1.5s infinite' }}>
                  <div className="flex justify-between items-center">
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '50%', height: 16, background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', marginBottom: '8px' }} />
                      <div style={{ width: '30%', height: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }} />
                    </div>
                    <div style={{ width: '60px', height: 20, background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px' }} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div style={{ width: '70px', height: 18, background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px' }} />
                    <div style={{ width: '80px', height: 18, background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px' }} />
                  </div>
                  <div style={{ width: '100%', height: 40, background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', marginTop: '10px' }} />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-4">
              {results.map((job: any) => {
                const salary = formatSalary(job);
                const exp = formatExp(job);
                const isExpanded = expandedJob === job.id;
                return (
                  <div key={job.id} className="card" style={{ padding: 'var(--space-5)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>{cleanTitle(job.title)}</h4>
                        <p className="text-muted text-sm">{job.company} · {job.location || 'Location not specified'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.grade && <span className={`badge-grade ${gradeClass(job.grade)}`}>{job.grade}</span>}
                        {job.overallScore != null && <span className="badge badge-info">{Math.round(job.overallScore)}/100</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
                      {job.workMode && <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{(job.workMode || '').replace(/_/g, ' ')}</span>}
                      {salary && <span className="badge badge-success">{salary}</span>}
                      {exp && <span className="badge badge-info">{exp}</span>}
                      {job.source && <span className="badge badge-neutral">{job.source}</span>}
                      {job.hasBond ? <span className="badge badge-warning">Bond</span> : null}
                      {job.isConsultancy ? <span className="badge badge-warning">Consultancy</span> : null}
                    </div>
                    {job.description && (
                      <p
                        className="text-sm text-muted"
                        style={{ maxHeight: isExpanded ? 'none' : 60, overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                      >
                        {isExpanded ? job.description : job.description.slice(0, 200) + (job.description.length > 200 ? '...' : '')}
                      </p>
                    )}
                    {job.description && job.description.length > 200 && (
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-1)', padding: '2px 4px', fontSize: 'var(--font-size-xs)' }} onClick={() => setExpandedJob(isExpanded ? null : job.id)}>
                        {isExpanded ? '▲ Less' : '▼ More'}
                      </button>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button className="btn btn-primary btn-sm" onClick={() => handleSaveJob(job)}>💾 Save to Tracker</button>
                      {job.sourceUrl && <a href={job.sourceUrl} target="_blank" rel="noopener" className="btn btn-secondary btn-sm">🔗 View Original</a>}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteJob(job.id)} style={{ marginLeft: 'auto' }}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No Jobs Yet</div>
              <div className="empty-state-text">Use keywords above or click "Scan Portals" to discover active openings.</div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Saved Inbox tab view */}
          {savedLoading ? (
            <div className="empty-state"><div style={{ animation: 'pulse 1.5s infinite' }}>Loading saved jobs...</div></div>
          ) : savedJobs.length > 0 ? (
            <div className="flex flex-col gap-4">
               {savedJobs.map((job: any) => (
                <div key={job.id} className="card" style={{ padding: 'var(--space-5)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 style={{ fontWeight: 600 }}>{job.jobTitle}</h4>
                      <p className="text-muted text-sm">{job.company} · {job.location || 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm" onClick={() => moveToStatus(job.id, 'shortlisted')}>⭐ Shortlist</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => moveToStatus(job.id, 'applied')}>📤 Applied</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => moveToStatus(job.id, 'archived')}>📦 Archive</button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {job.workMode && <span className="badge badge-neutral">{(job.workMode || '').replace(/_/g, ' ')}</span>}
                    {job.salaryText && <span className="badge badge-success">₹ {job.salaryText}</span>}
                    {job.fitScore && <span className="badge badge-info">Score: {Math.round(job.fitScore)}</span>}
                  </div>
                  {job.notes && <p className="text-sm text-muted mt-2">{job.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💾</div>
              <div className="empty-state-title">No Saved Jobs</div>
              <div className="empty-state-text">Save jobs from search results to review them later.</div>
              <button className="btn btn-primary" onClick={() => setActiveTab('search')}>Search Jobs</button>
            </div>
          )}
        </>
      )}

      {/* Manual Add Job Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Add Job Listing Manually</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddJob}>
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input className="form-input" required value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input className="form-input" required value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" placeholder="e.g. Bengaluru, KA" value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Work Mode</label>
                  <select className="form-select" value={newJob.workMode} onChange={e => setNewJob({ ...newJob, workMode: e.target.value })}>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Min LPA</label>
                  <input className="form-input" type="number" step="0.1" value={newJob.salaryMinLPA} onChange={e => setNewJob({ ...newJob, salaryMinLPA: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max LPA</label>
                  <input className="form-input" type="number" step="0.1" value={newJob.salaryMaxLPA} onChange={e => setNewJob({ ...newJob, salaryMaxLPA: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Min Exp (Yrs)</label>
                  <input className="form-input" type="number" step="0.5" value={newJob.experienceMin} onChange={e => setNewJob({ ...newJob, experienceMin: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Exp (Yrs)</label>
                  <input className="form-input" type="number" step="0.5" value={newJob.experienceMax} onChange={e => setNewJob({ ...newJob, experienceMax: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Source URL</label>
                <input className="form-input" placeholder="https://..." value={newJob.sourceUrl} onChange={e => setNewJob({ ...newJob, sourceUrl: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea className="form-textarea" value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-between mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
