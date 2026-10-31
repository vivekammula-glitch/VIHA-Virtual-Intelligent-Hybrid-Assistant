import { Routes, Route, Navigate } from 'react-router-dom';
import { getUser } from './lib/store.js';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ClassView from './pages/ClassView.jsx';
import Tutor from './pages/Tutor.jsx';

const Protected = ({ children }) => (getUser() ? children : <Navigate to="/auth" replace />);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/class/:id" element={<Protected><ClassView /></Protected>} />
      <Route path="/tutor" element={<Protected><Tutor /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
