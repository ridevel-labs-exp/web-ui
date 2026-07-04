import React, { useEffect, useState } from 'react';
import { driverService } from '../services/driverService';
import { tripService } from '../services/tripService';
import { authService } from '../services/authService';
import { Check, X, ShieldAlert, List, Clock, Eye } from 'lucide-react';

export default function AdminDashboard() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selected driver for detail document view modal
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Audit logs timeline tracker
  const [selectedTripId, setSelectedTripId] = useState('');
  const [tripHistory, setTripHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchDrivers = async () => {
    try {
      const data = await driverService.getAllDrivers();
      setDrivers(data);
    } catch (err) {
      setError('Failed to fetch driver registration list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleReview = async (driverId, status) => {
    try {
      await driverService.reviewOnboarding(driverId, status);
      fetchDrivers();
      setSelectedDriver(null);
    } catch (err) {
      console.error('Onboarding review action failed', err);
    }
  };

  const handleFetchHistory = async (e) => {
    e.preventDefault();
    if (!selectedTripId) return;
    setHistoryLoading(true);
    setTripHistory([]);
    try {
      const data = await tripService.getTripHistoryTimeline(selectedTripId);
      setTripHistory(data);
    } catch (err) {
      console.error('Failed to load trip history log timeline', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">Ridevel</div>
        <div className="sidebar-menu">
          <div className="menu-item active">
            <ShieldAlert size={18} /> Admin Dashboard
          </div>
        </div>
        <button onClick={authService.logout} className="btn-secondary" style={{ marginTop: 'auto' }}>
          Logout
        </button>
      </div>

      {/* Main Panel */}
      <div className="main-content">
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>Admin Panel</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Review driver credentials, approve onboarding, and inspect trip audit logs</p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-error)', padding: '12px', borderRadius: '8px', marginBottom: '32px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
          {/* Driver document reviews list */}
          <div className="glass-card">
            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <List style={{ color: 'var(--accent-cyan)' }} /> Driver Registration Queue
            </h2>

            {drivers.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No drivers registered in the database.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {drivers.map(drv => (
                  <div key={drv.id} style={{ border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>License: {drv.licenseNumber}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>RC Number: {drv.rcNumber}</div>
                      <div style={{ marginTop: '8px' }}>
                        <span className={`badge ${drv.onboardingStatus === 'APPROVED' ? 'badge-approved' : drv.onboardingStatus === 'PENDING' ? 'badge-pending' : 'badge-rejected'}`}>
                          {drv.onboardingStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '13px' }} onClick={() => setSelectedDriver(drv)}>
                        <Eye size={16} /> View Docs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side: Kafka Audit Logs inspector */}
          <div className="glass-card">
            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock style={{ color: 'var(--accent-cyan)' }} /> Inspect Trip Audit Logs
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
              Fetch the transition logs generated via Kafka event streaming for any trip ID.
            </p>

            <form onSubmit={handleFetchHistory} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Paste Trip ID (UUID)..."
                style={{ flexGrow: 1, fontSize: '13px', padding: '10px' }}
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px' }}>
                Load
              </button>
            </form>

            {historyLoading && <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading history...</div>}

            {tripHistory.length > 0 && (
              <div className="timeline">
                {tripHistory.map((item, idx) => (
                  <div key={item.id} className="timeline-item">
                    <div className={`timeline-dot ${idx === tripHistory.length - 1 ? 'active' : ''}`}></div>
                    <div className="timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--accent-cyan)' }}>{item.status}</strong>
                        <span style={{ color: 'var(--text-secondary)' }}>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Location: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tripHistory.length === 0 && !historyLoading && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>No log details loaded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Document Review Modal */}
      {selectedDriver && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3>Review Documents for Driver</h3>
              <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={() => setSelectedDriver(null)}>
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '14px' }}>
              <div>
                <div><strong>License:</strong> {selectedDriver.licenseNumber}</div>
                <div><strong>Insurance Policy:</strong> {selectedDriver.insurancePolicy}</div>
              </div>
              <div>
                <div><strong>RC Number:</strong> {selectedDriver.rcNumber}</div>
                <div><strong>Current Status:</strong> {selectedDriver.onboardingStatus}</div>
              </div>
            </div>

            {/* Document Photos Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center' }}>Front Photo</p>
                <img src={driverService.getFileUrl(selectedDriver.photoFrontUrl)} alt="Vehicle Front" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-glass)' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center' }}>Side Photo</p>
                <img src={driverService.getFileUrl(selectedDriver.photoSideUrl)} alt="Vehicle Side" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-glass)' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center' }}>Back Photo</p>
                <img src={driverService.getFileUrl(selectedDriver.photoBackUrl)} alt="Vehicle Back" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-glass)' }} />
              </div>
            </div>

            {/* Approval Controls */}
            {selectedDriver.onboardingStatus === 'PENDING' && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-primary" style={{ flexGrow: 1, background: 'var(--accent-success)', color: '#ffffff' }} onClick={() => handleReview(selectedDriver.id, 'APPROVED')}>
                  <Check size={18} /> Approve Application
                </button>
                <button className="btn-primary" style={{ flexGrow: 1, background: 'var(--accent-error)', color: '#ffffff' }} onClick={() => handleReview(selectedDriver.id, 'REJECTED')}>
                  <X size={18} /> Reject Application
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
