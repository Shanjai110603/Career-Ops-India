import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import SavedJobs from './pages/SavedJobs';
import Tracker from './pages/Tracker';
import ResumeStudio from './pages/ResumeStudio';
import CareerSwitch from './pages/CareerSwitch';
import InterviewPrep from './pages/InterviewPrep';
import SkillGap from './pages/SkillGap';
import RolePacks from './pages/RolePacks';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import AdminAI from './pages/admin/AdminAI';
import AdminDB from './pages/admin/AdminDB';
import AdminRolePacks from './pages/admin/AdminRolePacks';
import AdminJobSources from './pages/admin/AdminJobSources';
import AdminLocations from './pages/admin/AdminLocations';
import AdminSecurity from './pages/admin/AdminSecurity';
import AdminWorkspace from './pages/admin/AdminWorkspace';
import AdminProfiles from './pages/admin/AdminProfiles';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/saved" element={<SavedJobs />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/resume" element={<ResumeStudio />} />
        <Route path="/career-switch" element={<CareerSwitch />} />
        <Route path="/interview-prep" element={<InterviewPrep />} />
        <Route path="/skill-gap" element={<SkillGap />} />
        <Route path="/role-packs" element={<RolePacks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/admin/ai" element={<AdminAI />} />
        <Route path="/admin/database" element={<AdminDB />} />
        <Route path="/admin/role-packs" element={<AdminRolePacks />} />
        <Route path="/admin/job-sources" element={<AdminJobSources />} />
        <Route path="/admin/locations" element={<AdminLocations />} />
        <Route path="/admin/security" element={<AdminSecurity />} />
        <Route path="/admin/workspace" element={<AdminWorkspace />} />
        <Route path="/admin/profiles" element={<AdminProfiles />} />
      </Route>
    </Routes>
  );
}
