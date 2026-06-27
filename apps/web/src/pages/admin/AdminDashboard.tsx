import { useState } from 'react';
import AdminAI from './AdminAI';
import AdminDB from './AdminDB';
import AdminJobSources from './AdminJobSources';
import AdminRolePacks from './AdminRolePacks';
import AdminLocations from './AdminLocations';
import AdminProfiles from './AdminProfiles';
import AdminSecurity from './AdminSecurity';
import AdminWorkspace from './AdminWorkspace';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'ai' | 'db' | 'sources' | 'roles' | 'locations' | 'profiles' | 'security' | 'workspace'>('ai');

  const tabs = [
    { id: 'ai', label: '🤖 AI Providers' },
    { id: 'db', label: '💿 Database & Backups' },
    { id: 'sources', label: '🌐 Job Sources' },
    { id: 'roles', label: '🏷️ Role Packs' },
    { id: 'locations', label: '📍 India Locations' },
    { id: 'profiles', label: '👥 User Profiles' },
    { id: 'security', label: '🔒 Security' },
    { id: 'workspace', label: '🏗️ Workspace Setup' },
  ] as const;

  return (
    <div className="animate-fade-in">
      <div className="tabs" style={{ flexWrap: 'wrap', gap: 'var(--space-1)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            style={{ fontSize: 'var(--font-size-xs)', padding: '6px 12px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'ai' && <AdminAI />}
        {activeTab === 'db' && <AdminDB />}
        {activeTab === 'sources' && <AdminJobSources />}
        {activeTab === 'roles' && <AdminRolePacks />}
        {activeTab === 'locations' && <AdminLocations />}
        {activeTab === 'profiles' && <AdminProfiles />}
        {activeTab === 'security' && <AdminSecurity />}
        {activeTab === 'workspace' && <AdminWorkspace />}
      </div>
    </div>
  );
}
