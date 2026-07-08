import React, { useState, useEffect, useRef } from 'react';
import { driverService } from '../services/driverService';
import { tripService } from '../services/tripService';
import { telemetryService } from '../services/telemetryService';
import { authService } from '../services/authService';
import CabMap from '../components/CabMap';
import BrandedLoader from '../components/BrandedLoader';
import { Upload, CheckCircle2, AlertTriangle, Power, Navigation, FileText, KeyRound, X, RefreshCw, Clock, History, DollarSign, MapPin, Bell } from 'lucide-react';

export default function DriverOnboarding() {
  const user = authService.getCurrentUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [driverTab, setDriverTab] = useState('live'); // 'live' or 'history'
  
  // Rejection editing & notifications state
  const [isEditingRejection, setIsEditingRejection] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Form Fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [photoFront, setPhotoFront] = useState(null);
  const [photoSide, setPhotoSide] = useState(null);
  const [photoBack, setPhotoBack] = useState(null);
  const [photoRcFront, setPhotoRcFront] = useState(null);
  const [photoRcBack, setPhotoRcBack] = useState(null);
  const [photoLicense, setPhotoLicense] = useState(null);
  const [photoInsurance, setPhotoInsurance] = useState(null);
  const [photoPollution, setPhotoPollution] = useState(null);

  // Active Driver State
  const [isOnline, setIsOnline] = useState(false);
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [driverLoc, setDriverLoc] = useState({ lat: 12.9716, lng: 77.5946, isAvailable: true });

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTripId, setOtpTripId] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(null);

  // 30-Second Uber-Style Ride Offer Popup State
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [offerTimer, setOfferTimer] = useState(30);

  const fetchProfile = async () => {
    try {
      const data = await driverService.getProfile();
      setProfile(data);
      setIsOnline(data.isAvailable);
      if (data.onboardingStatus === 'REJECTED') {
        setLicenseNumber(data.licenseNumber || '');
        setInsurancePolicy(data.insurancePolicy || '');
        setRcNumber(data.rcNumber || '');
      }
      if (data.onboardingStatus === 'APPROVED') {
        fetchTrips();
      }
    } catch (err) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      const data = await tripService.getDriverTrips();
      setAssignedTrips(data || []);
    } catch (err) {
      console.error('Failed to load trips', err);
    }
  };

  useEffect(() => {
    fetchProfile();

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
  }, []);

  // Poll for nearby pending ride offers when online
  useEffect(() => {
    if (!isOnline || profile?.onboardingStatus !== 'APPROVED') return;

    const offerInterval = setInterval(async () => {
      const hasActiveTrip = assignedTrips.some(t => t.status === 'ACCEPTED' || t.status === 'ARRIVED' || t.status === 'STARTED');
      if (hasActiveTrip || incomingOffer) return;

      try {
        const data = await tripService.getDriverTrips();
        const pending = (data || []).find(t => t.status === 'REQUESTED');
        if (pending) {
          setIncomingOffer(pending);
          setOfferTimer(30);
        }
      } catch (e) {
        // quiet fail
      }
    }, 4000);

    return () => clearInterval(offerInterval);
  }, [isOnline, profile?.onboardingStatus, assignedTrips, incomingOffer]);

  // 30-Second Offer Countdown Timer
  useEffect(() => {
    if (!incomingOffer) return;

    if (offerTimer <= 0) {
      setIncomingOffer(null);
      return;
    }

    const timer = setInterval(() => {
      setOfferTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingOffer, offerTimer]);

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!photoFront || !photoSide || !photoBack || !photoRcFront || !photoRcBack || !photoLicense || !photoInsurance) {
      setError('Please upload all required driver documents & vehicle photos.');
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
        photoBack,
        photoRcFront,
        photoRcBack,
        photoLicense,
        photoInsurance,
        photoPollution
      });
      setProfile(response);
      setIsEditingRejection(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit onboarding files. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleOnline = async () => {
    const nextOnlineState = !isOnline;
    try {
      await telemetryService.sendMockLocation(profile.id, driverLoc.lat, driverLoc.lng, nextOnlineState);
      setIsOnline(nextOnlineState);
      setDriverLoc(prev => ({ ...prev, isAvailable: nextOnlineState }));
      setProfile(prev => ({ ...prev, isAvailable: nextOnlineState }));
    } catch (err) {
      console.error('Failed to toggle online status', err);
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

  const acceptRideOffer = async (tripId) => {
    try {
      await handleUpdateStatus(tripId, 'ACCEPTED');
      setIncomingOffer(null);
    } catch (e) {
      console.error('Error accepting ride offer', e);
    }
  };

  const declineRideOffer = () => {
    setIncomingOffer(null);
  };

  if (loading) {
    return <BrandedLoader text="Loading Ridevel Driver Workspace..." />;
  }

  // Calculate total earnings & completed trips for history
  const completedTrips = assignedTrips.filter(t => t.status === 'COMPLETED');
  const totalEarnings = completedTrips.reduce((sum, t) => sum + (parseFloat(t.fare) || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Concise Uber-Style Header */}
      <header style={{ height: '64px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' }}>Ridevel <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>DRIVER</span></div>
          
          {profile && profile.onboardingStatus === 'APPROVED' && (
            <nav style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setDriverTab('live')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: driverTab === 'live' ? '#EFF6FF' : 'transparent',
                  color: driverTab === 'live' ? '#2563EB' : '#64748B',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Navigation size={15} /> Live Map
              </button>

              <button
                onClick={() => setDriverTab('history')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: driverTab === 'history' ? '#EFF6FF' : 'transparent',
                  color: driverTab === 'history' ? '#2563EB' : '#64748B',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <History size={15} /> Trip History ({assignedTrips.length})
              </button>
            </nav>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {profile && profile.onboardingStatus === 'APPROVED' && (
            <button
              onClick={toggleOnline}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isOnline ? '#10B981' : '#FFFFFF',
                color: isOnline ? '#FFFFFF' : '#0F172A',
                border: isOnline ? 'none' : '1px solid #CBD5E1',
                padding: '6px 16px',
                borderRadius: '20px',
                fontWeight: '800',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: isOnline ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#FFFFFF' : '#94A3B8' }} />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            {/* Notification Bell */}
            {profile && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <Bell size={20} />
                  {profile.onboardingStatus === 'REJECTED' && (
                    <span style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '10px',
                      height: '10px',
                      background: '#EF4444',
                      borderRadius: '50%',
                      border: '2px solid #FFFFFF'
                    }} />
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '300px',
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    border: '1px solid #E2E8F0',
                    padding: '16px',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Notifications</span>
                      <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                    
                    {profile.onboardingStatus === 'REJECTED' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#EF4444' }}>🚨 Onboarding Rejected</div>
                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                          <strong>Reason:</strong> {profile.rejectionReason || "No details provided."}
                        </div>
                        <button
                          onClick={() => {
                            setIsEditingRejection(true);
                            setShowNotifications(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            marginTop: '4px'
                          }}
                        >
                          Action: Re-submit Documents
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '12px 0' }}>
                        No new notifications
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={authService.logout} style={{ background: '#F1F5F9', border: 'none', color: '#64748B', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px' }}>

        {/* Onboarding Document Upload Form */}
        {(!profile || isEditingRejection) && (
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText style={{ color: '#2563EB' }} /> Driver Registration & Onboarding
            </h2>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleOnboardingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Driving License Number</label>
                <input type="text" placeholder="DL-1234567890" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Vehicle RC Number</label>
                <input type="text" placeholder="KA-01-AB-1234" value={rcNumber} onChange={(e) => setRcNumber(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Insurance Policy Number</label>
                <input type="text" placeholder="POL-987654321" value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }} />
              </div>

              {/* Document Photo Uploads */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                
                {/* Section 1: Vehicle Pictures */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Vehicle Photos (Required)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <label style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                      <Upload size={18} style={{ color: '#2563EB', marginBottom: '4px' }} />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{photoFront ? photoFront.name.substring(0, 8) + '...' : 'Front Photo'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoFront)} />
                    </label>

                    <label style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                      <Upload size={18} style={{ color: '#2563EB', marginBottom: '4px' }} />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{photoSide ? photoSide.name.substring(0, 8) + '...' : 'Side Photo'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoSide)} />
                    </label>

                    <label style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                      <Upload size={18} style={{ color: '#2563EB', marginBottom: '4px' }} />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{photoBack ? photoBack.name.substring(0, 8) + '...' : 'Back Photo'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoBack)} />
                    </label>
                  </div>
                </div>

                {/* Section 2: RC Book */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Registration Certificate (RC Book - Required)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                      <Upload size={18} style={{ color: '#2563EB', marginBottom: '4px' }} />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{photoRcFront ? photoRcFront.name.substring(0, 8) + '...' : 'RC Front Photo'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoRcFront)} />
                    </label>

                    <label style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                      <Upload size={18} style={{ color: '#2563EB', marginBottom: '4px' }} />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{photoRcBack ? photoRcBack.name.substring(0, 8) + '...' : 'RC Back Photo'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoRcBack)} />
                    </label>
                  </div>
                </div>

                {/* Section 3: Driver License & Other Certificates */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Driver Credentials & Pollution</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <label style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                      <Upload size={18} style={{ color: '#2563EB', marginBottom: '4px' }} />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{photoLicense ? photoLicense.name.substring(0, 8) + '...' : 'License Photo'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoLicense)} />
                    </label>

                    <label style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                      <Upload size={18} style={{ color: '#2563EB', marginBottom: '4px' }} />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{photoInsurance ? photoInsurance.name.substring(0, 8) + '...' : 'Insurance Photo'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoInsurance)} />
                    </label>

                    <label style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                      <Upload size={18} style={{ color: '#64748B', marginBottom: '4px' }} />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{photoPollution ? photoPollution.name.substring(0, 8) + '...' : 'Pollution Doc (Opt)'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setPhotoPollution)} />
                    </label>
                  </div>
                </div>

              </div>

              <button type="submit" disabled={submitting} style={{ padding: '14px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}>
                {submitting ? 'Uploading Documents...' : 'Submit Registration'}
              </button>
            </form>
          </div>
        )}

        {/* Verification Pending / Rejected Screen */}
        {profile && profile.onboardingStatus !== 'APPROVED' && !isEditingRejection && (
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '40px', maxWidth: '540px', margin: '0 auto', textAlign: 'center' }}>
            <AlertTriangle size={48} style={{ color: profile.onboardingStatus === 'PENDING' ? '#D97706' : '#EF4444', margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>
              {profile.onboardingStatus === 'PENDING' ? 'Registration Under Review' : 'Application Rejected'}
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              {profile.onboardingStatus === 'PENDING'
                ? `Your documents (License: ${profile.licenseNumber}) are being verified by our administration team. You will be activated shortly.`
                : `Your driver registration was rejected. Reason: "${profile.rejectionReason || 'No details provided'}"`}
            </p>
            {profile.onboardingStatus === 'REJECTED' && (
              <button
                onClick={() => setIsEditingRejection(true)}
                style={{
                  padding: '10px 24px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Re-submit Documents
              </button>
            )}
          </div>
        )}

        {/* Approved Driver Workspace */}
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
            <div>
              {/* TAB 1: LIVE MAP & DISPATCH */}
              {driverTab === 'live' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Full-width Prominent Leaflet Map Container (Fixed height 480px) */}
                  <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Navigation size={18} style={{ color: '#2563EB' }} />
                        {activeTrip
                          ? (activeTrip.status === 'STARTED' ? 'Trip in Progress (Heading to Destination)' : 'Heading to Rider Pickup Location')
                          : 'Live Driver GPS Navigation'}
                      </div>
                      
                      {activeTrip && (
                        <div style={{ fontSize: '12px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: '12px' }}>
                          ACTIVE TRIP #{activeTrip.id.substring(0, 8).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Prominent Map Box */}
                    <div style={{ height: '460px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                      <CabMap pickup={mapPickup} drop={mapDrop} driver={driverLoc} />
                    </div>
                  </div>

                  {/* Driver Active Ride Card / Queue */}
                  <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 16px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                      {activeTrip ? 'Current Active Trip' : 'Your Ride Queue'}
                    </h3>

                    {!activeTrip ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                        {isOnline 
                          ? '🟢 You are ONLINE. Waiting for incoming ride requests within 10km...' 
                          : '🔴 You are OFFLINE. Click "GO ONLINE" in the top header to accept rides.'}
                      </div>
                    ) : (
                      <div style={{ background: '#F8FAFC', border: '1.5px solid #2563EB', borderRadius: '14px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569' }}>TRIP REF #{activeTrip.id.substring(0, 8).toUpperCase()}</span>
                          <span style={{ fontSize: '12px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: '12px' }}>
                            {activeTrip.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', marginBottom: '20px' }}>
                          <div>🟢 <strong>Pickup:</strong> {activeTrip.pickupAddress}</div>
                          <div>🔴 <strong>Dropoff:</strong> {activeTrip.dropAddress}</div>
                          <div style={{ fontSize: '18px', fontWeight: '900', color: '#2563EB', marginTop: '4px' }}>Fare: ₹{activeTrip.fare}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          {activeTrip.status === 'ACCEPTED' && (
                            <button onClick={() => handleUpdateStatus(activeTrip.id, 'ARRIVED')} style={{ width: '100%', padding: '14px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                              Mark as Arrived at Pickup Location
                            </button>
                          )}

                          {activeTrip.status === 'ARRIVED' && (
                            <button onClick={() => triggerStartTripWithOtp(activeTrip.id)} style={{ width: '100%', padding: '14px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <KeyRound size={18} /> Verify Rider OTP & Start Trip
                            </button>
                          )}

                          {activeTrip.status === 'STARTED' && (
                            <button onClick={() => handleUpdateStatus(activeTrip.id, 'COMPLETED')} style={{ width: '100%', padding: '14px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                              Complete Ride & Collect Fare (₹{activeTrip.fare})
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DRIVER TRIP HISTORY (Uber Style) */}
              {driverTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Earnings Overview Card */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Total Completed Trips</div>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>{completedTrips.length}</div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Total Earnings</div>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: '#10B981', marginTop: '4px' }}>₹{totalEarnings.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Past Trips List */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 20px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                      Completed Ride Logs
                    </h3>

                    {assignedTrips.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>No trip logs recorded yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {assignedTrips.map(trip => (
                          <div key={trip.id} style={{ border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '800', background: '#E2E8F0', padding: '3px 8px', borderRadius: '6px' }}>
                                  #TRIP-{trip.id.substring(0, 8).toUpperCase()}
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: '800', background: trip.status === 'COMPLETED' ? '#ECFDF5' : '#EFF6FF', color: trip.status === 'COMPLETED' ? '#10B981' : '#2563EB', padding: '3px 10px', borderRadius: '12px' }}>
                                  {trip.status}
                                </span>
                              </div>

                              <div style={{ fontSize: '13px', color: '#0F172A', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div>🟢 <strong>Pickup:</strong> {trip.pickupAddress}</div>
                                <div>🔴 <strong>Drop:</strong> {trip.dropAddress}</div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '20px', fontWeight: '900', color: '#10B981' }}>₹{trip.fare}</div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Ridevel Swift Dzire</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          );
        })()}

      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', width: '380px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Enter Rider OTP</h3>
              <X size={20} onClick={() => setShowOtpModal(false)} style={{ cursor: 'pointer', color: '#64748B' }} />
            </div>

            {otpError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px' }}>
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndStart}>
              <input
                type="text"
                maxLength={4}
                placeholder="4-digit OTP"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                style={{ width: '100%', padding: '12px', fontSize: '24px', textAlign: 'center', letterSpacing: '8px', fontWeight: '900', border: '2px solid #CBD5E1', borderRadius: '10px', marginBottom: '16px', outline: 'none' }}
                required
              />
              <button type="submit" style={{ width: '100%', padding: '14px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                Verify & Start Journey
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 30-Second Uber Offer Modal Popup */}
      {incomingOffer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px', width: '440px', maxWidth: '90vw', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '2px solid #2563EB' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EFF6FF', border: '4px solid #2563EB', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '28px', fontWeight: '900' }}>
              {offerTimer}s
            </div>

            <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>New Ride Request Nearby</div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', margin: '0 0 20px 0' }}>₹{incomingOffer.fare}</h2>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', textAlign: 'left', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>🟢 Pickup Location</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{incomingOffer.pickupAddress}</div>
              </div>
              <div style={{ borderTop: '1px dashed #CBD5E1', pt: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>🔴 Dropoff Destination</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{incomingOffer.dropAddress}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={declineRideOffer} style={{ padding: '16px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>
                Decline
              </button>
              <button onClick={() => acceptRideOffer(incomingOffer.id)} style={{ padding: '16px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '900', cursor: 'pointer' }}>
                ACCEPT RIDE ({offerTimer}s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
