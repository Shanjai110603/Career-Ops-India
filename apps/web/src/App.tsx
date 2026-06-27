import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Tracker from './pages/Tracker';
import ResumeStudio from './pages/ResumeStudio';
import CareerPlanner from './pages/CareerPlanner';
import InterviewPrep from './pages/InterviewPrep';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/resume" element={<ResumeStudio />} />
        <Route path="/career-planner" element={<CareerPlanner />} />
        <Route path="/interview-prep" element={<InterviewPrep />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}
