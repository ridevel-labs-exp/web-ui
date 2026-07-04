import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmail({ onNavigate }) {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setError('Verification token is missing. Please check your verification link.');
      setVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setSuccess(true);
      } catch (err) {
        const errMsg = err.response?.data?.error || 'Verification failed. The token may be expired or invalid.';
        setError(errMsg);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-box glass-card" style={{ textAlign: 'center', padding: '40px 30px' }}>
        <div className="auth-logo" style={{ marginBottom: '30px' }}>Ridevel</div>

        {verifying && (
          <div>
            <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--accent-cyan)', margin: '0 auto 20px auto' }} />
            <h3>Verifying Email Address</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Please wait while we confirm your registration details...</p>
          </div>
        )}

        {!verifying && success && (
          <div>
            <CheckCircle size={56} style={{ color: 'var(--accent-success)', margin: '0 auto 20px auto' }} />
            <h2 style={{ marginBottom: '12px' }}>Account Activated!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '15px', lineHeight: '1.5' }}>
              Your email has been verified successfully. Your Ridevel account is now fully active. You can log in and start booking or driving.
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => onNavigate('login')}>
              Go to Login
            </button>
          </div>
        )}

        {!verifying && error && (
          <div>
            <XCircle size={56} style={{ color: 'var(--accent-error)', margin: '0 auto 20px auto' }} />
            <h2 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '15px', lineHeight: '1.5' }}>
              {error}
            </p>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => onNavigate('login')}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
