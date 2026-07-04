import React, { useState } from 'react';
import { authService } from '../services/authService';
import { signInWithGoogle } from '../services/firebase';
import { User, Mail, Lock, Car, RefreshCw } from 'lucide-react';

export default function Register({ onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ROLE_DRIVER');
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

  const handleGoogleSignUp = async () => {
    setError(null);
    setMessage(null);
    try {
      const googleResult = await signInWithGoogle();
      const data = await authService.googleLogin(googleResult.idToken);
      onNavigate('rider');
    } catch (err) {
      console.error('Google SignUp error details:', err);
      const errMsg = err.response?.data?.error || err.message || 'Google Sign-Up failed. Please try again.';
      setError(errMsg);
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

        <button className="btn-google" onClick={handleGoogleSignUp} type="button" style={{ marginBottom: '16px' }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign up with Google
        </button>

        <div className="auth-divider">
          <span>or register manually</span>
        </div>

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
                <option value="ROLE_DRIVER">Driver</option>
                <option value="ROLE_RIDER">Rider</option>
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
