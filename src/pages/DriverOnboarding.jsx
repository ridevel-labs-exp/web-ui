import React, { useState, useEffect, useRef } from 'react';
import { driverService } from '../services/driverService';
import { tripService } from '../services/tripService';
import { telemetryService } from '../services/telemetryService';
import { authService } from '../services/authService';
import CabMap from '../components/CabMap';
import { Upload, CheckCircle2, AlertTriangle, Play, Pause, Power, Navigation, FileText, Check, KeyRound, X, RefreshCw } from 'lucide-react';

export default function DriverOnboarding() {
  const user = authService.getCurrentUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [photoFront, setPhotoFront] = useState(null);
  const [photoSide, setPhotoSide] = useState(null);
  const [photoBack, setPhotoBack] = useState(null);

  // Active Driver State
  const [isOnline, setIsOnline] = useState(false);
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [driverLoc, setDriverLoc] = useState({ lat: 12.9716, lng: 77.5946, isAvailable: true });

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTripId, setOtpTripId] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(null);
  
  // GPS Simulator State
  const [simulating, setSimulating] = useState(false);
  const simulationIntervalRef = useRef(null);
  const simulationStepRef = useRef(0);

  // Mock Route Coordinates (Bangalore Core Path for Demonstration)
  const mockRoute = [
    { lat: 12.9716, lng: 77.5946 }, // Bangalore Palace
    { lat: 12.9750, lng: 77.5980 },
    { lat: 12.9780, lng: 77.6020 },
    { lat: 12.9810, lng: 77.6060 },
    { lat: 12.9850, lng: 77.6100 }, // Commercial Street
    { lat: 12.9890, lng: 77.6150 },
    { lat: 12.9920, lng: 77.6200 }  // Ulsoor Lake
  ];

  const fetchProfile = async () => {
    try {
      const data = await driverService.getProfile();
      setProfile(data);
      setIsOnline(data.isAvailable);
      if (data.onboardingStatus === 'APPROVED') {
        fetchTrips();
      }
    } catch (err) {
      // Profile not found means they haven't onboarded yet
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      const data = await tripService.getDriverTrips();
      setAssignedTrips(data);
    } catch (err) {
      console.error('Failed to load trips', err);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Auto-detect driver's browser GPS coordinates on login
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDriverLoc(prev => ({
            ...prev,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }));
        },
        (err) => console.log('Driver geolocation fallback: ', err)
      );
    }

    return () => stopLocationSimulation();
  }, []);

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!photoFront || !photoSide || !photoBack) {
      setError('Please upload all three vehicle photos.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await driverService.submitOnboarding({
        licenseNumber,
        insurancePolicy,
        rcNumber,
        photoFront,
        photoSide,
        photoBack
      });
      setProfile(response);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit onboarding files. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleOnline = async () => {
    const nextOnlineState = !isOnline;
    try {
      const startCoord = mockRoute[0];
      await telemetryService.sendMockLocation(profile.id, startCoord.lat, startCoord.lng, nextOnlineState);
      setIsOnline(nextOnlineState);
      setDriverLoc(prev => ({ ...prev, isAvailable: nextOnlineState }));
      setProfile(prev => ({ ...prev, isAvailable: nextOnlineState }));
    } catch (err) {
      console.error('Failed to toggle online status', err);
    }
  };

  const startLocationSimulation = () => {
    if (simulating) return;
    setSimulating(true);
    simulationStepRef.current = 0;

    sendCoordPing(mockRoute[0]);

    simulationIntervalRef.current = setInterval(() => {
      simulationStepRef.current = (simulationStepRef.current + 1) % mockRoute.length;
      const nextCoord = mockRoute[simulationStepRef.current];
      sendCoordPing(nextCoord);
    }, 4000);
  };

  const stopLocationSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setSimulating(false);
  };

  const sendCoordPing = async (coord) => {
    try {
      await telemetryService.sendMockLocation(profile.id, coord.lat, coord.lng, isOnline);
      setDriverLoc({ lat: coord.lat, lng: coord.lng, isAvailable: isOnline });
      console.log('Telemetry Ping Sent:', coord);
    } catch (err) {
      console.error('Failed to send mock telemetry ping', err);
    }
  };

  const triggerStartTripWithOtp = (tripId) => {
    setOtpTripId(tripId);
    setOtpInput('');
    setOtpError(null);
    setShowOtpModal(true);
  };

  const handleVerifyOtpAndStart = (e) => {
    e.preventDefault();
    if (!otpTripId) return;

    const expectedOtp = String(parseInt(otpTripId.replace(/-/g, '').substring(0, 4), 16) % 9000 + 1000);
    if (otpInput.trim() === expectedOtp) {
      handleUpdateStatus(otpTripId, 'STARTED');
      setShowOtpModal(false);
    } else {
      setOtpError('Invalid OTP! Please ask the rider for the 4-digit code shown on their app screen.');
    }
  };

  const handleUpdateStatus = async (tripId, nextStatus) => {
    try {
      await tripService.updateTripStatus(tripId, nextStatus);
      fetchTrips();
    } catch (err) {
      console.error('Failed to update trip status', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--accent-cyan)' }} />
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">Ridevel</div>
        <div className="sidebar-menu">
          <div className="menu-item active">
            <Navigation size={18} /> Onboarding & Drive
          </div>
        </div>
        <button onClick={authService.logout} className="btn-secondary" style={{ marginTop: 'auto' }}>
          Logout
        </button>
      </div>

      {/* Main Panel */}
      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>Driver Workspace</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your registration, vehicle documents, and trips</p>
          </div>
          {profile && profile.onboardingStatus === 'APPROVED' && (
            <button
              onClick={toggleOnline}
              className="btn-primary"
              style={{
                background: isOnline ? 'var(--accent-success)' : 'rgba(255, 255, 255, 0.05)',
                color: isOnline ? '#ffffff' : 'var(--text-primary)',
                border: isOnline ? 'none' : '1px solid var(--border-glass)',
                padding: '10px 20px',
                boxShadow: isOnline ? '0 0 15px rgba(16,185,129,0.3)' : 'none'
              }}
            >
              <Power size={18} /> {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          )}
        </div>

        {/* 1. Onboarding Form (If profile not created yet) */}
        {!profile && (
          <div className="glass-card" style={{ maxWidth: '640px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText style={{ color: 'var(--accent-cyan)' }} /> Submit Onboarding Documents
            </h2>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-error)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleOnboardingSubmit}>
              <div className="input-group">
                <label className="input-label">Driver License Number</label>
                <input type="text" className="input-field" placeholder="DL-1234567890" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
              </div>

              <div className="input-group">
                <label className="input-label">Vehicle Registration Certificate (RC) Number</label>
                <input type="text" className="input-field" placeholder="KA-01-AB-1234" value={rcNumber} onChange={(e) => setRcNumber(e.target.value)} required />
              </div>

              <div className="input-group">
                <label className="input-label">Insurance Policy Number</label>
                <input type="text" className="input-field" placeholder="POL-987654321" value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)} required />
              </div>

              {/* Document Photo Uploads */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label className="btn-secondary" style={{ width: '100%', cursor: 'pointer', flexDirection: 'column', height: '100px', display: 'flex', justifyContent: 'center' }}>
                    <Upload size={20} style={{ marginBottom: '8px', color: 'var(--accent-cyan)' }} />
                    <span style={{ fontSize: '11px', textAlign: 'center' }}>{photoFront ? photoFront.name.substring(0, 10) + '...' : 'Front Photo'}</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoFront)} />
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label className="btn-secondary" style={{ width: '100%', cursor: 'pointer', flexDirection: 'column', height: '100px', display: 'flex', justifyContent: 'center' }}>
                    <Upload size={20} style={{ marginBottom: '8px', color: 'var(--accent-cyan)' }} />
                    <span style={{ fontSize: '11px', textAlign: 'center' }}>{photoSide ? photoSide.name.substring(0, 10) + '...' : 'Side Photo'}</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoSide)} />
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label className="btn-secondary" style={{ width: '100%', cursor: 'pointer', flexDirection: 'column', height: '100px', display: 'flex', justifyContent: 'center' }}>
                    <Upload size={20} style={{ marginBottom: '8px', color: 'var(--accent-cyan)' }} />
                    <span style={{ fontSize: '11px', textAlign: 'center' }}>{photoBack ? photoBack.name.substring(0, 10) + '...' : 'Back Photo'}</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoBack)} />
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Uploading Documents...' : 'Submit Documents'}
              </button>
            </form>
          </div>
        )}

        {/* 2. Onboarding Status is Pending/Rejected */}
        {profile && profile.onboardingStatus !== 'APPROVED' && (
          <div className="glass-card" style={{ maxWidth: '600px', textAlign: 'center', padding: '40px' }}>
            {profile.onboardingStatus === 'PENDING' ? (
              <div>
                <AlertTriangle size={56} style={{ color: 'var(--accent-warning)', margin: '0 auto 20px auto' }} />
                <h2 style={{ marginBottom: '12px' }}>Review in Progress</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Your documents (License: {profile.licenseNumber}) and vehicle details ({profile.rcNumber}) have been uploaded successfully.
                  An administrator is reviewing your registration. You will receive an email verification update shortly.
                </p>
              </div>
            ) : (
              <div>
                <AlertTriangle size={56} style={{ color: 'var(--accent-error)', margin: '0 auto 20px auto' }} />
                <h2 style={{ marginBottom: '12px', color: 'var(--accent-error)' }}>Application Rejected</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Unfortunately, your driver application has been rejected due to invalid document pictures. Please contact help@ridevel.in to re-apply.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. Driver Workspace (APPROVED) */}
        {profile && profile.onboardingStatus === 'APPROVED' && (() => {
          const activeTrip = assignedTrips.find(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
          
          let mapPickup = null;
          let mapDrop = null;
          if (activeTrip) {
            mapPickup = { lat: activeTrip.pickupLat, lng: activeTrip.pickupLng, address: activeTrip.pickupAddress };
            if (activeTrip.status === 'STARTED') {
              mapDrop = { lat: activeTrip.dropLat, lng: activeTrip.dropLng, address: activeTrip.dropAddress };
            }
          }

          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px' }}>
              {/* Left side: Live Driver Navigation Map & Trips Queue */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ padding: '16px' }}>
                  <h2 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Navigation size={18} style={{ color: 'var(--accent-cyan)' }} />
                    {activeTrip 
                      ? (activeTrip.status === 'STARTED' ? 'Trip in Progress (Heading to Destination)' : 'Heading to Rider Pickup')
                      : 'Live Driver GPS Position'}
                  </h2>
                  <CabMap pickup={mapPickup} drop={mapDrop} driver={driverLoc} />
                </div>

                <div className="glass-card">
                  <h2 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                    Your Trips Queue
                  </h2>
                  {assignedTrips.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No trips assigned yet. Go Online to accept ride matching requests.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {assignedTrips.map(trip => (
                        <div key={trip.id} style={{ border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Trip Ref: {trip.id.substring(0, 8)}...</span>
                            <span className={`badge ${trip.status === 'ACCEPTED' ? 'badge-approved' : 'badge-pending'}`}>{trip.status}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', marginBottom: '16px' }}>
                            <div>🟢 <strong>Pickup:</strong> {trip.pickupAddress}</div>
                            <div>🔴 <strong>Drop:</strong> {trip.dropAddress}</div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-cyan)', marginTop: '6px' }}>Fare: ₹{trip.fare}</div>
                          </div>

                          {/* Status update controls */}
                          <div style={{ display: 'flex', gap: '10px' }}>
                            {trip.status === 'ACCEPTED' && (
                              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', flexGrow: 1 }} onClick={() => handleUpdateStatus(trip.id, 'ARRIVED')}>
                                Mark as Arrived
                              </button>
                            )}
                            {trip.status === 'ARRIVED' && (
                              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', flexGrow: 1, gap: '6px' }} onClick={() => triggerStartTripWithOtp(trip.id)}>
                                <KeyRound size={16} /> Enter OTP & Start Trip
                              </button>
                            )}
                            {trip.status === 'STARTED' && (
                              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', flexGrow: 1 }} onClick={() => handleUpdateStatus(trip.id, 'COMPLETED')}>
                                Complete Trip
                              </button>
                            )}
                            {trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
                              <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--accent-error)' }} onClick={() => handleUpdateStatus(trip.id, 'CANCELLED')}>
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side: Live GPS mock telemetry broadcaster */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card">
                  <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Navigation style={{ color: 'var(--accent-cyan)' }} /> GPS Telemetry Simulator
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                    Demonstrate live coordinates tracking! Pinging coordinates triggers the WebSocket and updates the map layout in real-time.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '14px' }}>
                      <span>Simulator Status:</span>
                      <span style={{ fontWeight: '700', color: simulating ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                        {simulating ? 'Simulating Movement' : 'Inactive'}
                      </span>
                    </div>

                    {!simulating ? (
                      <button
                        onClick={startLocationSimulation}
                        disabled={!isOnline}
                        className="btn-primary"
                        style={{ width: '100%', gap: '8px' }}
                      >
                        <Play size={18} /> Start Route GPS Simulation
                      </button>
                    ) : (
                      <button
                        onClick={stopLocationSimulation}
                        className="btn-secondary"
                        style={{ width: '100%', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        <Pause size={18} /> Stop Simulation
                      </button>
                    )}

                    {!isOnline && (
                      <p style={{ fontSize: '12px', color: 'var(--accent-warning)', textAlign: 'center' }}>
                        * You must go ONLINE before enabling the telemetry simulation.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 4. OTP Verification Modal Overlay */}
        {showOtpModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="glass-card" style={{ maxWidth: '420px', width: '100%', position: 'relative' }}>
              <button 
                onClick={() => setShowOtpModal(false)} 
                style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <KeyRound size={48} style={{ color: 'var(--accent-cyan)', margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '20px' }}>Verify Rider OTP</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
                  Ask the rider for the 4-digit Ride Start OTP shown on their screen.
                </p>
              </div>

              {otpError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-error)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
                  {otpError}
                </div>
              )}

              <form onSubmit={handleVerifyOtpAndStart}>
                <div className="input-group">
                  <label className="input-label" style={{ textAlign: 'center' }}>Enter 4-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength={4}
                    className="input-field"
                    placeholder="••••"
                    style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: '800' }}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  Verify OTP & Start Trip
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
