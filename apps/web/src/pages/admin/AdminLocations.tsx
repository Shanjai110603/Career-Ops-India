import { useState, useEffect } from 'react';

export default function AdminLocations() {
  const [states, setStates] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('states');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/locations/states').then(r => r.json()).then(setStates).catch(() => {});
    fetch('/api/locations/regions').then(r => r.json()).then(setRegions).catch(() => {});
  }, []);

  const searchCities = async () => {
    if (!searchQuery) return;
    const res = await fetch(`/api/locations/cities?search=${searchQuery}`);
    setSearchResults(await res.json());
  };

  return (
    <div className="animate-fade-in">
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,191,36,0.1))', borderColor: 'rgba(245,158,11,0.3)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>📍 India Location Data</h2>
        <p className="text-muted text-sm">Complete India location database — {states.length} states/UTs, {regions.length} region groups, 50+ cities with tier classification.</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'states' ? 'active' : ''}`} onClick={() => setActiveTab('states')}>States & UTs ({states.length})</button>
        <button className={`tab ${activeTab === 'regions' ? 'active' : ''}`} onClick={() => setActiveTab('regions')}>Regions ({regions.length})</button>
        <button className={`tab ${activeTab === 'cities' ? 'active' : ''}`} onClick={() => setActiveTab('cities')}>City Search</button>
      </div>

      {activeTab === 'states' && (
        <div className="table-container">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Capital</th><th>Region</th><th>Type</th></tr></thead>
            <tbody>
              {states.map((s: any) => (
                <tr key={s.code}>
                  <td><span className="badge badge-info">{s.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td className="text-sm">{s.capital}</td>
                  <td><span className="badge badge-neutral">{s.region}</span></td>
                  <td><span className={`badge ${s.isUT ? 'badge-warning' : 'badge-success'}`}>{s.isUT ? 'UT' : 'State'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'regions' && (
        <div className="flex flex-col gap-4">
          {regions.map((r: any) => (
            <div key={r.id} className="card">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>{r.name}</h4>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {r.states.map((code: string) => {
                  const state = states.find((s: any) => s.code === code);
                  return <span key={code} className="badge badge-info">{state?.name || code}</span>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'cities' && (
        <div>
          <div className="flex gap-3 mb-6">
            <input className="form-input" style={{ maxWidth: 400 }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchCities()} placeholder="Search cities..." />
            <button className="btn btn-primary" onClick={searchCities}>🔍 Search</button>
          </div>
          {searchResults.length > 0 && (
            <div className="table-container">
              <table>
                <thead><tr><th>City</th><th>State</th><th>District</th><th>Tier</th><th>Metro</th></tr></thead>
                <tbody>
                  {searchResults.map((c: any) => (
                    <tr key={c.name}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td><span className="badge badge-info">{c.stateCode}</span></td>
                      <td className="text-sm">{c.district}</td>
                      <td><span className="badge badge-neutral">{c.tier}</span></td>
                      <td>{c.isMetro ? <span className="badge badge-success">Metro</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
