import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import { useState, useEffect } from 'react';

function useAuth() {
  const [token] = useState(() => localStorage.getItem('animefox-token'));
  return !!token;
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuth = useAuth();
  if (!isAuth) return <Navigate to="/" replace />;
  return children;
}

function BackgroundParticles() {
  useEffect(() => {
    const container = document.getElementById('bg-particles');
    if (!container) return;

    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'bg-particle';

      const size = Math.random() * 4 + 2;
      const left = Math.random() * 100;
      const duration = Math.random() * 15 + 10;
      const delay = Math.random() * 10;
      const opacity = Math.random() * 0.3 + 0.1;

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        opacity: ${opacity};
      `;

      container.appendChild(particle);
    }
  }, []);

  return <div id="bg-particles" className="bg-particles" />;
}

export default function App() {
  return (
    <>
      <div className="bg-atmosphere" />
      <div className="bg-grid" />
      <BackgroundParticles />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}