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

      {/* Problems & Solutions (Our Innovation) Section */}
      <section className="innovation-section">
        <div className="innovation-title-wrap">
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A' }}>Tackling Ride-Hailing Friction</h2>
          <p>Traditional car rentals and cab bookings are riddled with complications. Here is how Ridevel innovates to deliver a seamless experience.</p>
        </div>

        {/* Row 1: Problem - Complex Booking */}
        <div className="innovation-row">
          <div className="innovation-badge badge-red">Problem</div>
          <div className="innovation-card">
            <div className="card-text">
              <h3>Complex Booking</h3>
              <p>Too many steps make renting a car frustrating and slow. From extensive document processes to slow confirmation screens, booking becomes a hassle.</p>
            </div>
            <div className="card-illustration">
              <svg viewBox="0 0 200 120" width="100%" height="100%">
                <rect x="20" y="10" width="45" height="85" rx="8" fill="#334155" />
                <rect x="24" y="15" width="37" height="75" rx="5" fill="#E2E8F0" />
                <circle cx="42" cy="35" r="5" fill="#EF4444" />
                <path d="M 42,35 L 32,55 L 52,65" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="2,2" />
                <g transform="translate(60, 45)">
                  <rect x="15" y="25" width="95" height="25" rx="10" fill="#EF4444" />
                  <path d="M 30,25 L 45,8 L 85,8 L 95,25 Z" fill="#EF4444" />
                  <path d="M 48,11 L 62,11 L 62,22 L 48,22 Z" fill="#FFFFFF" opacity="0.6" />
                  <path d="M 66,11 L 80,11 L 80,22 L 66,22 Z" fill="#FFFFFF" opacity="0.6" />
                  <circle cx="40" cy="50" r="14" fill="#000000" />
                  <circle cx="40" cy="50" r="6" fill="#FFFFFF" />
                  <circle cx="85" cy="50" r="14" fill="#000000" />
                  <circle cx="85" cy="50" r="6" fill="#FFFFFF" />
                  <circle cx="103" cy="30" r="4" fill="#FBBF24" />
                </g>
                <circle cx="30" cy="70" r="3" fill="#64748B" />
                <circle cx="155" cy="20" r="4" fill="#64748B" opacity="0.3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Row 2: Problem - Hidden Fees */}
        <div className="innovation-row innovation-row-reverse">
          <div className="innovation-badge badge-red">Problem</div>
          <div className="innovation-card">
            <div className="card-text">
              <h3>Hidden Fees</h3>
              <p>Users face unexpected charges, causing distrust and dissatisfaction. Fine print and sudden price surges make pricing unpredictable.</p>
            </div>
            <div className="card-illustration">
              <svg viewBox="0 0 200 120" width="100%" height="100%">
                <g transform="translate(10, 45)">
                  <rect x="15" y="25" width="95" height="25" rx="10" fill="#EF4444" />
                  <path d="M 30,25 L 45,8 L 85,8 L 95,25 Z" fill="#EF4444" />
                  <path d="M 48,11 L 62,11 L 62,22 L 48,22 Z" fill="#FFFFFF" opacity="0.6" />
                  <path d="M 66,11 L 80,11 L 80,22 L 66,22 Z" fill="#FFFFFF" opacity="0.6" />
                  <circle cx="40" cy="50" r="14" fill="#000000" />
                  <circle cx="40" cy="50" r="6" fill="#FFFFFF" />
                  <circle cx="85" cy="50" r="14" fill="#000000" />
                  <circle cx="85" cy="50" r="6" fill="#FFFFFF" />
                </g>
                <g transform="translate(115, 15)">
                  <rect x="5" y="10" width="55" height="75" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
                  <polygon points="32.5,20 17.5,45 47.5,45" fill="#EF4444" />
                  <text x="30" y="40" fill="#FFFFFF" fontSize="12" fontWeight="bold">!</text>
                  <line x1="15" y1="58" x2="50" y2="58" stroke="#CBD5E1" strokeWidth="2" />
                  <line x1="15" y1="66" x2="40" y2="66" stroke="#CBD5E1" strokeWidth="2" />
                  <line x1="15" y1="74" x2="45" y2="74" stroke="#EF4444" strokeWidth="2" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Row 3: Solution - Simplified Booking */}
        <div className="innovation-row">
          <div className="innovation-badge badge-green">Solution</div>
          <div className="innovation-card">
            <div className="card-text">
              <h3>Simplified Booking</h3>
              <p>Streamlined steps for quick, hassle-free car rentals anytime. Pin your location, pick a ride, pay via UPI, and your cab is on the way in two taps.</p>
            </div>
            <div className="card-illustration">
              <svg viewBox="0 0 200 120" width="100%" height="100%">
                <rect x="20" y="10" width="45" height="85" rx="8" fill="#334155" />
                <rect x="24" y="15" width="37" height="75" rx="5" fill="#E2E8F0" />
                <path d="M 31,50 L 39,57 L 50,42" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <g transform="translate(60, 45)">
                  <rect x="15" y="25" width="95" height="25" rx="10" fill="#10B981" />
                  <path d="M 30,25 L 45,8 L 85,8 L 95,25 Z" fill="#10B981" />
                  <path d="M 48,11 L 62,11 L 62,22 L 48,22 Z" fill="#FFFFFF" opacity="0.6" />
                  <path d="M 66,11 L 80,11 L 80,22 L 66,22 Z" fill="#FFFFFF" opacity="0.6" />
                  <circle cx="40" cy="50" r="14" fill="#334155" />
                  <circle cx="40" cy="50" r="6" fill="#FFFFFF" />
                  <circle cx="85" cy="50" r="14" fill="#334155" />
                  <circle cx="85" cy="50" r="6" fill="#FFFFFF" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Row 4: Solution - Transparent Pricing */}
        <div className="innovation-row innovation-row-reverse">
          <div className="innovation-badge badge-green">Solution</div>
          <div className="innovation-card">
            <div className="card-text">
              <h3>Transparent Pricing</h3>
              <p>Clear, upfront costs to build trust and avoid surprises. Fares are calculated instantly based on distance, and verified before the journey starts.</p>
            </div>
            <div className="card-illustration">
              <svg viewBox="0 0 200 120" width="100%" height="100%">
                <g transform="translate(10, 45)">
                  <rect x="15" y="25" width="95" height="25" rx="10" fill="#10B981" />
                  <path d="M 30,25 L 45,8 L 85,8 L 95,25 Z" fill="#10B981" />
                  <path d="M 48,11 L 62,11 L 62,22 L 48,22 Z" fill="#FFFFFF" opacity="0.6" />
                  <path d="M 66,11 L 80,11 L 80,22 L 66,22 Z" fill="#FFFFFF" opacity="0.6" />
                  <circle cx="40" cy="50" r="14" fill="#334155" />
                  <circle cx="40" cy="50" r="6" fill="#FFFFFF" />
                  <circle cx="85" cy="50" r="14" fill="#334155" />
                  <circle cx="85" cy="50" r="6" fill="#FFFFFF" />
                </g>
                <g transform="translate(120, 15)">
                  <path d="M 10,10 L 45,10 L 45,45 C 45,65 27.5,75 27.5,75 C 27.5,75 10,65 10,45 Z" fill="#10B981" />
                  <text x="21" y="45" fill="#FFFFFF" fontSize="24" fontWeight="bold">₹</text>
                </g>
              </svg>
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
