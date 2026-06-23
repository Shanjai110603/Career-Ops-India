import { useState, useEffect } from 'react';

export default function RolePacks() {
  const [packs, setPacks] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetch('/api/role-packs').then(r => r.json()).then(d => setPacks(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{packs.length} role pack{packs.length !== 1 ? 's' : ''} available</p>
        <a href="/admin/role-packs" className="btn btn-secondary">⚙️ Manage Role Packs</a>
      </div>

      <div className="flex flex-col gap-4">
        {packs.map((pack: any) => {
          const skills = Array.isArray(pack.skills) ? pack.skills : JSON.parse(pack.skills || '[]');
          const keywords = Array.isArray(pack.keywords) ? pack.keywords : JSON.parse(pack.keywords || '[]');
          const interviewTopics = Array.isArray(pack.interviewTopics || pack.interview_topics) ? (pack.interviewTopics || pack.interview_topics) : JSON.parse(pack.interview_topics || pack.interviewTopics || '[]');
          const isExpanded = expandedId === pack.id;

          return (
            <div key={pack.id} className="card" onClick={() => setExpandedId(isExpanded ? null : pack.id)} style={{ cursor: 'pointer' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="stat-icon indigo"><span style={{ fontSize: '1.25rem' }}>🎯</span></div>
                  <div>
                    <h4 style={{ fontWeight: 600 }}>{pack.name}</h4>
                    <p className="text-muted text-xs">{pack.family} · {pack.description?.slice(0, 60) || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${pack.enabled !== false ? 'badge-success' : 'badge-neutral'}`}>
                    {pack.enabled !== false ? 'Active' : 'Disabled'}
                  </span>
                  <span className={`badge ${pack.isCustom || pack.is_custom ? 'badge-warning' : 'badge-info'}`}>
                    {pack.isCustom || pack.is_custom ? 'Custom' : 'Built-in'}
                  </span>
                  <span style={{ fontSize: '1rem' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4" onClick={e => e.stopPropagation()}>
                  <div className="grid-2">
                    <div>
                      <h5 className="text-sm font-bold mb-2">Keywords</h5>
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        {keywords.map((k: string) => <span key={k} className="badge badge-neutral">{k}</span>)}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold mb-2">Skills</h5>
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        {skills.map((s: string) => <span key={s} className="badge badge-info">{s}</span>)}
                      </div>
                    </div>
                  </div>
                  {interviewTopics.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-bold mb-2">Interview Topics</h5>
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        {interviewTopics.map((t: string) => <span key={t} className="badge badge-warning">{t}</span>)}
                      </div>
                    </div>
                  )}
                  {pack.resumeStrategy || pack.resume_strategy ? (
                    <div className="mt-4">
                      <h5 className="text-sm font-bold mb-2">Resume Strategy</h5>
                      <p className="text-sm text-muted">{pack.resumeStrategy || pack.resume_strategy}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
