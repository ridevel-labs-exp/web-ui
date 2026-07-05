import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RiderDashboard from './pages/RiderDashboard';
import DriverOnboarding from './pages/DriverOnboarding';
import AdminDashboard from './pages/AdminDashboard';
import { authService } from './services/authService';
import { requestNotificationPermission } from './services/firebase';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  useEffect(() => {
    // 1. Check if token parameter exists (for email verify or reset password)
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.replace('/', '') || 'landing';

    if (params.has('token')) {
      if (path.includes('reset-password')) {
        setCurrentPage('reset-password');
      } else {
        setCurrentPage('verify');
      }
      return;
    }

    // 2. Auto-login session recovery logic on startup
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      if (user) {
        requestNotificationPermission().catch(err => console.log('FCM setup bypassed: ', err));
        if (user.role === 'ROLE_ADMIN') {
          setCurrentPage('admin');
          return;
        } else if (user.role === 'ROLE_DRIVER') {
          setCurrentPage('driver');
          return;
        } else {
          setCurrentPage('rider');
          return;
        }
      }
    }

    // 3. Sync page state based on current URL path for unauthenticated users
    const validPages = ['landing', 'login', 'register', 'forgot-password', 'reset-password'];
    const initialPage = validPages.includes(path) ? path : 'landing';
    setCurrentPage(initialPage);

    // Set initial history state if not set
    if (!window.history.state || !window.history.state.page) {
      const targetPath = initialPage === 'landing' ? '/' : `/${initialPage}`;
      window.history.replaceState({ page: initialPage }, '', targetPath);
    }
  }, []);

  useEffect(() => {
    // 4. Handle browser Back and Forward button navigation (popstate events)
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
      } else {
        const path = window.location.pathname.replace('/', '') || 'landing';
        setCurrentPage(path);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    
    // Push new entry to browser history
    if (page !== 'verify' && page !== 'reset-password') {
      const targetPath = page === 'landing' ? '/' : `/${page}`;
      window.history.pushState({ page }, '', targetPath);
    }
    
    if (page === 'rider' || page === 'driver' || page === 'admin') {
      requestNotificationPermission().catch(err => console.log('FCM setup bypassed: ', err));
    }
  };

  // Simple Router
  switch (currentPage) {
    case 'landing':
      return <LandingPage onNavigate={navigateTo} />;
    case 'login':
      return <Login onNavigate={navigateTo} />;
    case 'register':
      return <Register onNavigate={navigateTo} />;
    case 'verify':
      return <VerifyEmail onNavigate={navigateTo} />;
    case 'forgot-password':
      return <ForgotPassword onNavigate={navigateTo} />;
    case 'reset-password':
      return <ResetPassword onNavigate={navigateTo} />;
    case 'rider':
      return <RiderDashboard />;
    case 'driver':
      return <DriverOnboarding />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <LandingPage onNavigate={navigateTo} />;
  }
}
