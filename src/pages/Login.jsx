import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Mail, Lock, RefreshCw } from 'lucide-react';

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  useEffect(() => {
    // Check if redirect was caused by expired session
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired')) {
      setInfoMessage('Your session has expired. Please log in again.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const data = await authService.login(email, password);
      
      // Redirect based on User Role
      if (data.role === 'ROLE_ADMIN') {
        onNavigate('admin');
      } else if (data.role === 'ROLE_DRIVER') {
        onNavigate('driver');
      } else {
        onNavigate('rider');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Invalid email, password, or unverified account.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-card">
        <div className="auth-header">
          <div className="auth-logo">Ridevel</div>
          <p style={{ color: 'var(--text-secondary)' }}>Log in to access premium rides</p>
        </div>

        {infoMessage && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            color: 'var(--accent-warning)',
            padding: '12px',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {infoMessage}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: 'var(--accent-error)',
            padding: '12px',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                placeholder="name@domain.com"
                style={{ width: '100%', paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                placeholder="••••••"
                style={{ width: '100%', paddingLeft: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          <p>Demo Admin Logins:</p>
          <code style={{ color: 'var(--accent-cyan)' }}>admin@ridevel.in / admin123</code>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <span
            style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => onNavigate('register')}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
