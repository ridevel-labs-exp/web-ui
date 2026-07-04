import React, { useState, useEffect } from 'react';
import { tripService } from '../services/tripService';
import { telemetryService } from '../services/telemetryService';
import { authService } from '../services/authService';
import CabMap from '../components/CabMap';
import { MapPin, Navigation, Compass, FileText, CheckCircle2, Download, RefreshCw } from 'lucide-react';

export default function RiderDashboard() {
  const user = authService.getCurrentUser();
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map markers state
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);

  // Billing Invoice State
  const [invoice, setInvoice] = useState(null);
  const [paying, setPaying] = useState(false);

  // Pre-configured Bangalore landmarks for fast testing
  const landmarks = [
    { name: 'Bangalore Palace (Center)', lat: 12.9716, lng: 77.5946 },
    { name: 'Commercial Street (North)', lat: 12.9850, lng: 77.6100 },
    { name: 'Ulsoor Lake (East)', lat: 12.9920, lng: 77.6200 },
    { name: 'MG Road Metro (South)', lat: 12.9730, lng: 77.6070 }
  ];

  const handleSelectLandmark = (type, landmark) => {
    const coords = { lat: landmark.lat, lng: landmark.lng, address: landmark.name };
    if (type === 'pickup') {
      setPickup(coords);
    } else {
      setDrop(coords);
    }
  };

  const handleBookTrip = async () => {
    if (!pickup || !drop) {
      setError('Please select both pickup and drop-off destinations.');
      return;
    }

    setLoading(true);
    setError(null);
    setInvoice(null);

    try {
      const response = await tripService.requestTrip({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropLat: drop.lat,
        dropLng: drop.lng,
        pickupAddress: pickup.address,
        dropAddress: drop.address
      });
      setActiveTrip(response);
    } catch (err) {
      setError(err.response?.data?.error || 'No drivers available in your area. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Poll for trip status updates and activate live WebSocket tracking if driver matched
  useEffect(() => {
    if (!activeTrip) return;

    let pollInterval = null;
    let liveTracker = null;

    // If driver matched, establish real-time WebSocket connection to track driver movement
    if (activeTrip.driverId) {
      console.log('Driver assigned! Subscribing to telemetry coordinate stream...');
      liveTracker = telemetryService.createLiveTracker(activeTrip.driverId, (coords) => {
        setDriverLoc({
          lat: parseFloat(coords.latitude),
          lng: parseFloat(coords.longitude),
          isAvailable: coords.isAvailable
        });
      });
    }

    // Poll trip status changes (Requested -> Accepted -> Arrived -> Started -> Completed)
    pollInterval = setInterval(async () => {
      try {
        const details = await tripService.getTripDetails(activeTrip.id);
        setActiveTrip(details);

        if (details.status === 'COMPLETED') {
          clearInterval(pollInterval);
          if (liveTracker) liveTracker.disconnect();
          fetchInvoice(details.id);
        } else if (details.status === 'CANCELLED') {
          clearInterval(pollInterval);
          if (liveTracker) liveTracker.disconnect();
          setActiveTrip(null);
          setDriverLoc(null);
          alert('Your trip was cancelled by the driver.');
        }
      } catch (e) {
        console.error('Error polling trip details', e);
      }
    }, 3000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (liveTracker) liveTracker.disconnect();
    };
  }, [activeTrip?.id, activeTrip?.driverId]);

  const fetchInvoice = async (tripId) => {
    try {
      // Allow 1 second for Kafka event to process invoice creation
      setTimeout(async () => {
        const data = await tripService.getTripInvoice(tripId);
        setInvoice(data);
      }, 1000);
    } catch (err) {
      console.error('Failed to load generated invoice', err);
    }
  };

  const handlePay = async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      // Simulate UPI reference transaction ID callback
      const mockPaymentId = 'pay_upi_' + Math.random().toString(36).substring(2, 12);
      const updatedInvoice = await tripService.payTripInvoice(invoice.id, mockPaymentId);
      setInvoice(updatedInvoice);
      alert('UPI Payment Verified and Completed successfully!');
    } catch (err) {
      alert('Payment simulation failed.');
    } finally {
      setPaying(false);
    }
  };

  const resetDashboard = () => {
    setActiveTrip(null);
    setPickup(null);
    setDrop(null);
    setDriverLoc(null);
    setInvoice(null);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">Ridevel</div>
        <div className="sidebar-menu">
          <div className="menu-item active">
            <Compass size={18} /> Book a Ride
          </div>
        </div>
        <button onClick={authService.logout} className="btn-secondary" style={{ marginTop: 'auto' }}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '32px' }}>
        {/* Left Control Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Trip Booking Module */}
          {!activeTrip && !invoice && (
            <div className="glass-card">
              <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Navigation style={{ color: 'var(--accent-cyan)' }} /> Where to?
              </h2>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-error)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              {/* Pickup selection */}
              <div className="input-group">
                <label className="input-label">🟢 Select Pickup Location</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  {landmarks.map(lm => (
                    <button key={lm.name} className="btn-secondary" style={{ padding: '6px', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden' }} onClick={() => handleSelectLandmark('pickup', lm)}>
                      {lm.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
                <input type="text" readOnly className="input-field" placeholder="Select a pickup pin above..." value={pickup ? pickup.address : ''} />
              </div>

              {/* Destination selection */}
              <div className="input-group" style={{ marginTop: '10px' }}>
                <label className="input-label">🔴 Select Destination</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  {landmarks.map(lm => (
                    <button key={lm.name} className="btn-secondary" style={{ padding: '6px', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden' }} onClick={() => handleSelectLandmark('drop', lm)}>
                      {lm.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
                <input type="text" readOnly className="input-field" placeholder="Select a destination pin..." value={drop ? drop.address : ''} />
              </div>

              <button className="btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleBookTrip} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Confirm Ride'}
              </button>
            </div>
          )}

          {/* Active Trip Tracking Status Card */}
          {activeTrip && !invoice && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Ride Status Dashboard</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '14px' }}>
                  <span>Matching Status:</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{activeTrip.status}</span>
                </div>

                <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>🟢 <strong>Pickup:</strong> {activeTrip.pickupAddress}</div>
                  <div>🔴 <strong>Drop:</strong> {activeTrip.dropAddress}</div>
                </div>

                {activeTrip.driverId ? (
                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px', marginTop: '10px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>ASSIGNED VEHICLE DRIVER:</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                      Driver Ref: {activeTrip.driverId.substring(0, 8)}...
                    </div>
                    {driverLoc ? (
                      <p style={{ fontSize: '12px', color: 'var(--accent-success)', marginTop: '4px' }}>
                        📡 GPS connection active. Tracking driver vehicle moving...
                      </p>
                    ) : (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Waiting for driver telemetry coordinates ping...
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <RefreshCw className="animate-spin" size={16} style={{ color: 'var(--accent-warning)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Searching for nearest available cab...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Premium Invoice & Payment checkout screen */}
          {invoice && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--accent-success)', margin: '0 auto 12px auto' }} />
                <h3>Ride Completed!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Invoice Ref: {invoice.id.substring(0, 8)}...</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ride Base Fare:</span>
                  <strong>₹{invoice.fare}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxes & Fees:</span>
                  <strong>₹0.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '10px', fontSize: '16px', fontWeight: '700' }}>
                  <span>Total Bill Amount:</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>₹{invoice.fare}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span>Payment Status:</span>
                  <span className={`badge ${invoice.paymentStatus === 'COMPLETED' ? 'badge-approved' : 'badge-pending'}`}>{invoice.paymentStatus}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {invoice.paymentStatus === 'PENDING' ? (
                  <div style={{ border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.01)', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--accent-cyan)' }}>
                      UPI Payment Gateway
                    </div>
                    
                    {/* Simulated UPI ID input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Enter UPI ID (e.g. mobile@upi)</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="username@okaxis" 
                        style={{ padding: '8px', fontSize: '13px' }}
                        defaultValue={user ? `${user.email.split('@')[0]}@okaxis` : 'rider@okaxis'}
                      />
                    </div>

                    {/* UPI App selector icons simulation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', marginBottom: '12px' }}>
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                        <div key={app} style={{
                          flexGrow: 1,
                          textAlign: 'center',
                          padding: '6px',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '6px',
                          fontSize: '11px',
                          background: 'rgba(255,255,255,0.02)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }} onClick={(e) => {
                          e.target.style.borderColor = 'var(--accent-cyan)';
                          e.target.style.color = '#ffffff';
                        }}>
                          {app}
                        </div>
                      ))}
                    </div>

                    <button 
                      className="btn-primary" 
                      style={{ width: '100%', background: 'var(--accent-glow)', color: '#000000', fontWeight: '700' }} 
                      onClick={handlePay} 
                      disabled={paying}
                    >
                      {paying ? 'Verifying UPI Request...' : 'Pay via UPI App'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: 'var(--accent-success)', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
                    <span>UPI Payment Completed Successfully!</span>
                  </div>
                )}

                <a
                  href={tripService.getInvoicePdfUrl(invoice.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Download size={16} /> Download PDF Invoice
                </a>

                <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={resetDashboard}>
                  Book Another Ride
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Map Canvas Panel */}
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin style={{ color: 'var(--accent-cyan)' }} /> Live Navigation Route
          </h2>
          <CabMap pickup={pickup} drop={drop} driver={driverLoc} />
        </div>
      </div>
    </div>
  );
}
