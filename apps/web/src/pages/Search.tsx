import { useState, useEffect } from 'react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [experience, setExperience] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', description: '', location: '', workMode: '', salaryText: '', source: 'manual', sourceUrl: '' });
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/jobs?limit=20').then(r => r.json()).then(j => setResults(Array.isArray(j) ? j : [])).catch(() => {});
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (location) params.set('location', location);
    if (workMode) params.set('workMode', workMode);
    if (minSalary) params.set('minSalary', minSalary);
    if (maxSalary) params.set('maxSalary', maxSalary);
    try {
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch { setResults([]); }
    setLoading(false);
  };

  const handleAddJob = async () => {
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob),
    });
    setShowAddModal(false);
    setNewJob({ title: '', company: '', description: '', location: '', workMode: '', salaryText: '', source: 'manual', sourceUrl: '' });
    handleSearch();
  };

  const handleSaveJob = async (job: any) => {
    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, company: job.company, jobTitle: job.title, status: 'saved', location: job.location, workMode: job.work_mode }),
    });
    alert('Job saved to tracker!');
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

  return (
    <div className="animate-fade-in">
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
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : '🔍 Search Jobs'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAddModal(true)}>
            ➕ Add Job Manually
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
          {results.length > 0 ? `${results.length} Jobs Found` : 'No jobs yet'}
        </h3>
      </div>

      {results.length > 0 ? (
        <div className="flex flex-col gap-4">
          {results.map((job: any) => (
            <div key={job.id} className="card" style={{ padding: 'var(--space-5)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>{job.title}</h4>
                  <p className="text-muted text-sm">{job.company} · {job.location || 'Location not specified'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {job.grade && <span className={`badge-grade ${gradeClass(job.grade)}`}>{job.grade}</span>}
                  {job.overall_score && <span className="badge badge-info">{Math.round(job.overall_score)}/100</span>}
                </div>
              </div>
              <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
                {job.work_mode && <span className="badge badge-neutral">{(job.work_mode || '').replace(/_/g, ' ')}</span>}
                {job.salary_text && <span className="badge badge-success">₹ {job.salary_text}</span>}
                {job.source && <span className="badge badge-neutral">{job.source}</span>}
                {job.has_bond ? <span className="badge badge-warning">Bond</span> : null}
                {job.is_consultancy ? <span className="badge badge-warning">Consultancy</span> : null}
              </div>
              {job.description && <p className="text-sm text-muted" style={{ maxHeight: 60, overflow: 'hidden' }}>{job.description.slice(0, 200)}...</p>}
              <div className="flex gap-2 mt-3">
                <button className="btn btn-primary btn-sm" onClick={() => handleSaveJob(job)}>💾 Save</button>
                {job.source_url && <a href={job.source_url} target="_blank" rel="noopener" className="btn btn-secondary btn-sm">🔗 View Original</a>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No Jobs Yet</div>
          <div className="empty-state-text">Search for jobs using the filters above, or add jobs manually.</div>
        </div>
      )}

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Add Job Manually</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Job Title *</label>
              <input className="form-input" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} placeholder="e.g. Software Engineer" />
            </div>
            <div className="form-group">
              <label className="form-label">Company *</label>
              <input className="form-input" value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} placeholder="e.g. Infosys" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} placeholder="e.g. Bengaluru" />
              </div>
              <div className="form-group">
                <label className="form-label">Work Mode</label>
                <select className="form-select" value={newJob.workMode} onChange={e => setNewJob({ ...newJob, workMode: e.target.value })}>
                  <option value="">Select</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                  <option value="wfh">WFH</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Salary</label>
                <input className="form-input" value={newJob.salaryText} onChange={e => setNewJob({ ...newJob, salaryText: e.target.value })} placeholder="e.g. 8-12 LPA" />
              </div>
              <div className="form-group">
                <label className="form-label">Source URL</label>
                <input className="form-input" value={newJob.sourceUrl} onChange={e => setNewJob({ ...newJob, sourceUrl: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Job Description</label>
              <textarea className="form-textarea" value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} placeholder="Paste the full job description here..." rows={6} />
            </div>
            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddJob} disabled={!newJob.title || !newJob.company}>Save Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
