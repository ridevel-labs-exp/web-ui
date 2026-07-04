import React from 'react';
import { MapPin, Shield, CreditCard, Bell, ChevronRight, Zap, Star } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="auth-logo" style={{ marginBottom: 0, fontSize: '28px' }}>Ridevel</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" style={{ padding: '10px 20px', fontSize: '14px' }} onClick={() => onNavigate('login')}>
              Sign In
            </button>
            <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }} onClick={() => onNavigate('register')}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={14} />
            <span>Premium Mobility Platform</span>
          </div>
          <h1 className="hero-title">
            Your Ride,<br />
            <span className="hero-highlight">Your Way.</span>
          </h1>
          <p className="hero-subtitle">
            Book premium cab rides instantly. Real-time GPS tracking, 
            secure UPI payments, and ride alerts — all in one seamless experience.
          </p>
          <div className="hero-actions">
            <button className="btn-primary hero-cta" onClick={() => onNavigate('register')}>
              Start Riding
              <ChevronRight size={18} />
            </button>
            <button className="btn-secondary hero-cta" onClick={() => onNavigate('login')}>
              I already have an account
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <Star size={16} style={{ color: '#ffcc00' }} />
              <span><strong>4.9</strong> Rating</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span><strong>10K+</strong> Rides</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span><strong>500+</strong> Drivers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <h2 className="features-title">Why Riders Choose Ridevel</h2>
        <div className="features-grid">
          <div className="feature-card glass-card">
            <div className="feature-icon">
              <MapPin size={24} />
            </div>
            <h3>Live GPS Tracking</h3>
            <p>Track your driver in real-time on an interactive map from pickup to drop-off.</p>
          </div>
          <div className="feature-card glass-card">
            <div className="feature-icon">
              <CreditCard size={24} />
            </div>
            <h3>Secure UPI Payments</h3>
            <p>Pay seamlessly with GPay, PhonePe, Paytm, or any UPI app. No cash needed.</p>
          </div>
          <div className="feature-card glass-card">
            <div className="feature-icon">
              <Bell size={24} />
            </div>
            <h3>Instant Alerts</h3>
            <p>Receive SMS, email, and push notifications for every ride status update.</p>
          </div>
          <div className="feature-card glass-card">
            <div className="feature-icon">
              <Shield size={24} />
            </div>
            <h3>Safe & Verified</h3>
            <p>All drivers are background-verified. Your safety is our top priority.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 Ridevel Mobility Pvt. Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
