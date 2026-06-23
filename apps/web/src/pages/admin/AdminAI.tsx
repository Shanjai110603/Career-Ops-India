import { useState, useEffect } from 'react';

export default function AdminAI() {
  const [providers, setProviders] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [newProvider, setNewProvider] = useState({
    name: '', type: 'openai', baseUrl: '', apiKey: '', defaultModel: '',
    fallbackModel: '', temperature: 0.7, maxTokens: 4096, timeout: 30000, streaming: false, enabled: true,
  });

  const loadProviders = () => { fetch('/api/ai-providers').then(r => r.json()).then(d => setProviders(Array.isArray(d) ? d : [])).catch(() => {}); };
  useEffect(() => { loadProviders(); }, []);

  const addProvider = async () => {
    await fetch('/api/ai-providers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProvider) });
    setShowAdd(false);
    setNewProvider({ name: '', type: 'openai', baseUrl: '', apiKey: '', defaultModel: '', fallbackModel: '', temperature: 0.7, maxTokens: 4096, timeout: 30000, streaming: false, enabled: true });
    loadProviders();
  };

  const testProvider = async (id: string) => {
    setTesting(id);
    setTestResult(null);
    try {
      const res = await fetch(`/api/ai-providers/${id}/test`, { method: 'POST' });
      setTestResult(await res.json());
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    }
    setTesting(null);
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('Delete this AI provider?')) return;
    await fetch(`/api/ai-providers/${id}`, { method: 'DELETE' });
    loadProviders();
  };

  const providerTypes = [
    { value: 'openai', label: 'OpenAI', models: 'gpt-4o, gpt-4o-mini, gpt-4-turbo' },
    { value: 'gemini', label: 'Google Gemini', models: 'gemini-2.5-flash, gemini-2.5-pro' },
    { value: 'anthropic', label: 'Anthropic', models: 'claude-sonnet-4, claude-opus-4' },
    { value: 'openrouter', label: 'OpenRouter', models: 'Any model via OpenRouter' },
    { value: 'groq', label: 'Groq', models: 'llama-3.3-70b-versatile, mixtral-8x7b' },
    { value: 'ollama', label: 'Ollama (Local)', models: 'llama3.2, mistral, codellama' },
    { value: 'lmstudio', label: 'LM Studio (Local)', models: 'Any GGUF model' },
    { value: 'custom', label: 'Custom OpenAI-Compatible', models: 'Any custom endpoint' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))', borderColor: 'rgba(16,185,129,0.3)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>🤖 AI Provider Configuration</h2>
        <p className="text-muted text-sm">Connect any AI provider — cloud APIs, local models via Ollama/LM Studio, or custom endpoints. AI is optional — all core features work without it.</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{providers.length} provider{providers.length !== 1 ? 's' : ''} configured</p>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ Add AI Provider</button>
      </div>

      {testResult && (
        <div className={`card mb-4 ${testResult.success ? '' : ''}`} style={{ borderColor: testResult.success ? 'var(--success)' : 'var(--danger)', padding: 'var(--space-4)' }}>
          <span className={testResult.success ? 'badge badge-success' : 'badge badge-danger'}>{testResult.success ? '✅ Connected' : '❌ Failed'}</span>
          <p className="text-sm mt-2">{testResult.message}</p>
          {testResult.latencyMs && <p className="text-xs text-muted">Latency: {testResult.latencyMs}ms</p>}
        </div>
      )}

      {/* Provider List */}
      {providers.length > 0 ? (
        <div className="flex flex-col gap-4">
          {providers.map((p: any) => (
            <div key={p.id} className="card" style={{ padding: 'var(--space-5)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="stat-icon green"><span>🤖</span></div>
                  <div>
                    <h4 style={{ fontWeight: 600 }}>{p.name}</h4>
                    <p className="text-muted text-xs">{p.type} · Model: {p.default_model || 'Not set'} · Key: {p.api_key || 'None'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => testProvider(p.id)} disabled={testing === p.id}>
                    {testing === p.id ? '⏳ Testing...' : '🧪 Test'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteProvider(p.id)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !showAdd ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <div className="empty-state-title">No AI Providers</div>
          <div className="empty-state-text">AI is optional. Configure a provider to enable AI-powered features like resume tailoring and interview prep.</div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Add Your First Provider</button>
        </div>
      ) : null}

      {/* Add Provider Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add AI Provider</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Provider Name *</label>
                <input className="form-input" value={newProvider.name} onChange={e => setNewProvider({ ...newProvider, name: e.target.value })} placeholder="e.g. My OpenAI Key" />
              </div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="form-select" value={newProvider.type} onChange={e => setNewProvider({ ...newProvider, type: e.target.value })}>
                  {providerTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span className="form-hint">{providerTypes.find(t => t.value === newProvider.type)?.models}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input className="form-input" type="password" value={newProvider.apiKey} onChange={e => setNewProvider({ ...newProvider, apiKey: e.target.value })} placeholder="sk-..." />
              <span className="form-hint">Not required for local providers (Ollama, LM Studio)</span>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Base URL</label>
                <input className="form-input" value={newProvider.baseUrl} onChange={e => setNewProvider({ ...newProvider, baseUrl: e.target.value })} placeholder="Leave blank for default" />
              </div>
              <div className="form-group">
                <label className="form-label">Default Model</label>
                <input className="form-input" value={newProvider.defaultModel} onChange={e => setNewProvider({ ...newProvider, defaultModel: e.target.value })} placeholder="e.g. gpt-4o-mini" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Temperature</label>
                <input className="form-input" type="number" min="0" max="2" step="0.1" value={newProvider.temperature} onChange={e => setNewProvider({ ...newProvider, temperature: parseFloat(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Tokens</label>
                <input className="form-input" type="number" value={newProvider.maxTokens} onChange={e => setNewProvider({ ...newProvider, maxTokens: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Timeout (ms)</label>
                <input className="form-input" type="number" value={newProvider.timeout} onChange={e => setNewProvider({ ...newProvider, timeout: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addProvider} disabled={!newProvider.name || !newProvider.type}>Save Provider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
