import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User, Mail, Lock, Car, RefreshCw } from 'lucide-react';

export default function Register({ onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ROLE_RIDER');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await authService.register(name, email, password, role);
      setMessage('Registration successful! Please check your email for the verification link.');
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.email || 'Registration failed. Try again.';
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
          <p style={{ color: 'var(--text-secondary)' }}>Create your account to start riding</p>
        </div>

        {message && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: 'var(--accent-success)',
            padding: '12px',
            fontSize: '14px',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            {message}
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
            <label className="input-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="John Doe"
                style={{ width: '100%', paddingLeft: '40px' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-secondary)' }} />
            </div>
          </div>

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

          <div className="input-group">
            <label className="input-label">I want to register as a</label>
            <div style={{ position: 'relative' }}>
              <select
                className="select-field"
                style={{ width: '100%', paddingLeft: '40px', appearance: 'none', WebkitAppearance: 'none' }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="ROLE_RIDER">Rider (Book rides)</option>
                <option value="ROLE_DRIVER">Driver (Earn money)</option>
              </select>
              <Car size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Register Now'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <span
            style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => onNavigate('login')}
          >
            Log In
          </span>
        </p>
      </div>
    </div>
  );
}
