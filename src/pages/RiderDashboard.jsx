import React, { useState, useEffect } from 'react';
import { tripService } from '../services/tripService';
import { telemetryService } from '../services/telemetryService';
import { authService } from '../services/authService';
import CabMap from '../components/CabMap';
import { MapPin, Navigation, Compass, CheckCircle2, Download, RefreshCw, Calendar, Clock, ChevronDown, LocateFixed, Car, Info } from 'lucide-react';

// City Database with popular locations across India
const CITIES_DATA = {
  Chennai: {
    center: { lat: 13.0827, lng: 80.2707 },
    landmarks: [
      { name: '✈️ Chennai International Airport (MAA)', lat: 12.9941, lng: 80.1709 },
      { name: '🚉 Chennai Central Railway Station (MAS)', lat: 13.0827, lng: 80.2707 },
      { name: '🛍️ T. Nagar Shopping District', lat: 13.0418, lng: 80.2341 },
      { name: '💻 OMR IT Corridor (Taramani/Perungudi)', lat: 12.9698, lng: 80.2443 },
      { name: '🌆 Anna Nagar Roundtana', lat: 13.0850, lng: 80.2101 },
      { name: '🌊 ECR Beach Road (Thiruvanmiyur)', lat: 12.9830, lng: 80.2594 },
      { name: '🏢 Guindy Industrial Estate', lat: 13.0102, lng: 80.2157 },
      { name: '🏙️ Velachery Transport Hub', lat: 12.9759, lng: 80.2212 }
    ]
  },
  Bangalore: {
    center: { lat: 12.9716, lng: 77.5946 },
    landmarks: [
      { name: '✈️ Kempegowda Int\'l Airport (BLR)', lat: 13.1986, lng: 77.7066 },
      { name: '🏰 Bangalore Palace (Center)', lat: 12.9716, lng: 77.5946 },
      { name: '💻 Electronic City IT Park', lat: 12.8452, lng: 77.6602 },
      { name: '🌆 Indiranagar 100ft Road', lat: 12.9784, lng: 77.6408 },
      { name: '🏢 Whitefield ITPL', lat: 12.9870, lng: 77.7312 },
      { name: '🛍️ Koramangala Forum Hub', lat: 12.9352, lng: 77.6245 }
    ]
  },
  Coimbatore: {
    center: { lat: 11.0168, lng: 76.9558 },
    landmarks: [
      { name: '✈️ Coimbatore Int\'l Airport (CJB)', lat: 11.0300, lng: 77.0434 },
      { name: '🚉 Coimbatore Junction Railway Station', lat: 10.9980, lng: 76.9629 },
      { name: '💻 TIDEL Park Coimbatore', lat: 11.0247, lng: 77.0264 },
      { name: '🌆 RS Puram Commercial Zone', lat: 11.0069, lng: 76.9507 },
      { name: '🛍️ Gandhipuram Bus Stand', lat: 11.0168, lng: 76.9558 }
    ]
  },
  Delhi: {
    center: { lat: 28.6139, lng: 77.2090 },
    landmarks: [
      { name: '✈️ IGI Airport Terminal 3 (DEL)', lat: 28.5562, lng: 77.1000 },
      { name: '🏛️ Connaught Place (CP Center)', lat: 28.6315, lng: 77.2167 },
      { name: '💻 Cyber Hub Gurgaon', lat: 28.4950, lng: 77.0890 },
      { name: '🏢 Noida Sector 62 IT Hub', lat: 28.6270, lng: 77.3720 },
      { name: '🚉 New Delhi Railway Station', lat: 28.6430, lng: 77.2190 }
    ]
  },
  Mumbai: {
    center: { lat: 19.0760, lng: 72.8777 },
    landmarks: [
      { name: '✈️ Chhatrapati Shivaji Airport (BOM)', lat: 19.0896, lng: 72.8656 },
      { name: '🏢 Bandra Kurla Complex (BKC)', lat: 19.0660, lng: 72.8690 },
      { name: '🌊 Marine Drive Promenade', lat: 18.9438, lng: 72.8230 },
      { name: '🌆 Andheri West Commerce Hub', lat: 19.1136, lng: 72.8461 },
      { name: '🚉 Chhatrapati Shivaji Terminus (CST)', lat: 18.9400, lng: 72.8350 }
    ]
  },
  Kolkata: {
    center: { lat: 22.5726, lng: 88.3639 },
    landmarks: [
      { name: '✈️ Netaji Subhash Airport (CCU)', lat: 22.6547, lng: 88.4467 },
      { name: '🏛️ Park Street Commercial Hub', lat: 22.5530, lng: 88.3520 },
      { name: '💻 Salt Lake Sector V IT Zone', lat: 22.5790, lng: 88.4340 },
      { name: '🚉 Howrah Junction Railway Station', lat: 22.5850, lng: 88.3420 }
    ]
  },
  Hyderabad: {
    center: { lat: 17.3850, lng: 78.4867 },
    landmarks: [
      { name: '✈️ Rajiv Gandhi Int\'l Airport (HYD)', lat: 17.2403, lng: 78.4294 },
      { name: '💻 HITEC City Cyber Towers', lat: 17.4504, lng: 78.3808 },
      { name: '🌆 Banjara Hills Road No 1', lat: 17.4156, lng: 78.4489 },
      { name: '🚉 Secunderabad Railway Station', lat: 17.4340, lng: 78.5010 }
    ]
  }
};

// Uber-style vehicle categories with per-km rates & SVG graphics
const VEHICLE_TYPES = [
  {
    id: 'SEDAN',
    name: 'Dezire Sedan',
    tagline: 'Comfortable, popular sedan cabs',
    baseFare: 50,
    ratePerKm: 18,
    etaMin: '3 min away',
    capacity: 4,
    color: '#EAB308',
    icon: (
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 18C6 14 10 11 16 10L20 6C22 5 28 5 32 6L36 10C42 11 44 14 44 18V22C44 23 43 24 42 24H6C5 24 4 23 4 22V18Z" fill="#FACC15" stroke="#854D0E" strokeWidth="2"/>
        <path d="M14 11L18 7H30L34 11H14Z" fill="#1E293B" opacity="0.8"/>
        <circle cx="12" cy="24" r="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5"/>
        <circle cx="36" cy="24" r="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'HATCHBACK',
    name: 'Go Hatchback',
    tagline: 'Affordable, compact daily rides',
    baseFare: 30,
    ratePerKm: 14,
    etaMin: '2 min away',
    capacity: 4,
    color: '#22C55E',
    icon: (
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 18C8 14 12 11 18 10L22 7C24 6 28 6 31 7L34 10C39 11 42 14 42 18V22H8V18Z" fill="#4ADE80" stroke="#15803D" strokeWidth="2"/>
        <path d="M16 11L20 8H28L32 11H16Z" fill="#1E293B" opacity="0.8"/>
        <circle cx="13" cy="23" r="3.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5"/>
        <circle cx="35" cy="23" r="3.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'SUV',
    name: 'SUV Ertiga / Innova',
    tagline: 'Spacious 6-seater for family & luggage',
    baseFare: 80,
    ratePerKm: 24,
    etaMin: '5 min away',
    capacity: 6,
    color: '#EF4444',
    icon: (
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 16C5 12 8 9 15 8L20 4C22 3 30 3 35 4L39 8C43 9 45 12 45 16V22C45 23.5 43.5 25 42 25H6C4.5 25 3 23.5 3 22V16Z" fill="#F87171" stroke="#991B1B" strokeWidth="2"/>
        <path d="M13 9L18 5H32L37 9H13Z" fill="#1E293B" opacity="0.85"/>
        <circle cx="11" cy="24" r="4.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5"/>
        <circle cx="37" cy="24" r="4.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'PREMIER',
    name: 'Executive Premier',
    tagline: 'Top-rated drivers & luxury cars',
    baseFare: 120,
    ratePerKm: 32,
    etaMin: '4 min away',
    capacity: 4,
    color: '#38BDF8',
    icon: (
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 18C6 14 10 11 16 10L20 6C22 5 28 5 32 6L36 10C42 11 44 14 44 18V22H6V18Z" fill="#38BDF8" stroke="#0369A1" strokeWidth="2"/>
        <path d="M14 11L18 7H30L34 11H14Z" fill="#0F172A" opacity="0.9"/>
        <circle cx="12" cy="23" r="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5"/>
        <circle cx="36" cy="23" r="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5"/>
      </svg>
    )
  }
];

export default function RiderDashboard() {
  const user = authService.getCurrentUser();
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active City Selection (Auto-detect or Manual)
  const [selectedCity, setSelectedCity] = useState('Chennai');
  const [detectingLoc, setDetectingLoc] = useState(false);

  // Map markers state
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);

  // Vehicle Selection State
  const [selectedVehicle, setSelectedVehicle] = useState('SEDAN');

  // Schedule / Plan for Later State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Billing Invoice State
  const [invoice, setInvoice] = useState(null);
  const [paying, setPaying] = useState(false);

  // Auto-Detect User GPS Location & City on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      setDetectingLoc(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setDetectingLoc(false);

          // Find closest city in India database
          let closestCity = 'Chennai';
          let minDistance = Infinity;

          Object.keys(CITIES_DATA).forEach((city) => {
            const center = CITIES_DATA[city].center;
            const dist = calculateHaversineKm(userLat, userLng, center.lat, center.lng);
            if (dist < minDistance) {
              minDistance = dist;
              closestCity = city;
            }
          });

          setSelectedCity(closestCity);

          // Set user's current GPS location as priority pickup
          setPickup({
            lat: userLat,
            lng: userLng,
            address: `📍 My Current Location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`
          });
        },
        (err) => {
          console.warn('Geolocation permission denied or unavailable:', err);
          setDetectingLoc(false);
          // Fallback to default city center
          const cityCenter = CITIES_DATA['Chennai'].center;
          setPickup({
            lat: cityCenter.lat,
            lng: cityCenter.lng,
            address: '📍 Chennai Central Hub'
          });
        },
        { timeout: 10000 }
      );
    }
  }, []);

  // Calculate distance in kilometers using Haversine formula
  const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate estimated distance between pickup & drop
  const tripDistanceKm = pickup && drop ? calculateHaversineKm(pickup.lat, pickup.lng, drop.lat, drop.lng) : 0;

  // Detect if user selected a future date/time -> "Plan for Later"
  const handleDateTimeChange = (date, time) => {
    setScheduledDate(date);
    setScheduledTime(time);

    if (date && time) {
      const selectedDateTime = new Date(`${date}T${time}`);
      const now = new Date();
      // If selected time is more than 15 minutes in the future
      if (selectedDateTime.getTime() - now.getTime() > 15 * 60 * 1000) {
        setIsScheduled(true);
      } else {
        setIsScheduled(false);
      }
    }
  };

  const handleBookTrip = async () => {
    if (!pickup || !drop) {
      setError('Please select both pickup and destination locations.');
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
        dropAddress: drop.address,
        vehicleType: selectedVehicle,
        isScheduled,
        scheduledDateTime: isScheduled ? `${scheduledDate} ${scheduledTime}` : null
      });
      setActiveTrip(response);
    } catch (err) {
      setError(err.response?.data?.error || 'No drivers available in your area. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Poll for trip status updates and WebSocket tracking
  useEffect(() => {
    if (!activeTrip) return;

    let pollInterval = null;
    let liveTracker = null;

    if (activeTrip.driverId) {
      liveTracker = telemetryService.createLiveTracker(activeTrip.driverId, (coords) => {
        setDriverLoc({
          lat: parseFloat(coords.latitude),
          lng: parseFloat(coords.longitude),
          isAvailable: coords.isAvailable
        });
      });
    }

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
    setDrop(null);
    setDriverLoc(null);
    setInvoice(null);
  };

  const currentCityData = CITIES_DATA[selectedCity] || CITIES_DATA['Chennai'];

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
      <div className="main-content" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '28px' }}>
        
        {/* Left Booking Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top City Header */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current City</span>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📍 {selectedCity}
              </div>
            </div>

            {/* City Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {detectingLoc && <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>Detecting Location...</span>}
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  const city = CITIES_DATA[e.target.value];
                  if (city) {
                    setPickup({
                      lat: city.center.lat,
                      lng: city.center.lng,
                      address: `📍 ${e.target.value} Center`
                    });
                    setDrop(null);
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {Object.keys(CITIES_DATA).map((city) => (
                  <option key={city} value={city} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trip Booking Screen */}
          {!activeTrip && !invoice && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation style={{ color: 'var(--accent-cyan)' }} size={20} /> Where to in {selectedCity}?
                </h2>

                {/* Plan for Later Badge */}
                {isScheduled && (
                  <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> Plan for Later
                  </span>
                )}
              </div>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-error)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              {/* 🟢 Pickup Location Dropdown & Input */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🟢 Pickup Location</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setPickup({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            address: `📍 My GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
                          });
                        });
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <LocateFixed size={12} /> Use My GPS Location
                  </button>
                </label>

                <select
                  className="input-field"
                  value={pickup ? pickup.address : ''}
                  onChange={(e) => {
                    const lm = currentCityData.landmarks.find((l) => l.name === e.target.value);
                    if (lm) setPickup({ lat: lm.lat, lng: lm.lng, address: lm.name });
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {pickup && <option value={pickup.address}>{pickup.address}</option>}
                  <option value="" disabled>Select Popular Landmark in {selectedCity}...</option>
                  {currentCityData.landmarks.map((lm) => (
                    <option key={lm.name} value={lm.name} style={{ background: '#0f172a' }}>
                      {lm.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔴 Drop Destination Dropdown */}
              <div className="input-group">
                <label className="input-label">🔴 Select Destination</label>
                <select
                  className="input-field"
                  value={drop ? drop.address : ''}
                  onChange={(e) => {
                    const lm = currentCityData.landmarks.find((l) => l.name === e.target.value);
                    if (lm) setDrop({ lat: lm.lat, lng: lm.lng, address: lm.name });
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="" disabled>Choose Destination in {selectedCity}...</option>
                  {currentCityData.landmarks.map((lm) => (
                    <option key={lm.name} value={lm.name} style={{ background: '#0f172a' }}>
                      {lm.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Uber-Style Vehicle Selection Cards */}
              <div>
                <label className="input-label" style={{ marginBottom: '10px' }}>🚕 Select Cab Category</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {VEHICLE_TYPES.map((v) => {
                    const isSelected = selectedVehicle === v.id;
                    const estimatedFare = Math.round(v.baseFare + (tripDistanceKm > 0 ? v.ratePerKm * tripDistanceKm : 0));

                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicle(v.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: `1.5px solid ${isSelected ? v.color : 'var(--border-glass)'}`,
                          background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flexShrink: 0 }}>{v.icon}</div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {v.name}
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '400' }}>({v.capacity} seats)</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.etaMin} • {v.tagline}</div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: isSelected ? v.color : '#ffffff' }}>
                            ₹{estimatedFare}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            ₹{v.ratePerKm}/km
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time Selector (Plan for Later) */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Schedule Ride (Optional):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="date"
                    className="input-field"
                    style={{ fontSize: '12px', padding: '8px' }}
                    value={scheduledDate}
                    onChange={(e) => handleDateTimeChange(e.target.value, scheduledTime)}
                  />
                  <input
                    type="time"
                    className="input-field"
                    style={{ fontSize: '12px', padding: '8px' }}
                    value={scheduledTime}
                    onChange={(e) => handleDateTimeChange(scheduledDate, e.target.value)}
                  />
                </div>
              </div>

              {/* 1 km Distance Buffer Policy Notice */}
              <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Info size={15} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Buffer Policy:</strong> Small route variations under <strong>1 km</strong> carry no additional charge. Any extra distance beyond 1 km will be billed at standard per-km rate upon ride completion.
                </span>
              </div>

              <button className="btn-primary" style={{ width: '100%', marginTop: '4px', padding: '14px', fontSize: '16px', fontWeight: '700' }} onClick={handleBookTrip} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : (isScheduled ? 'Confirm Scheduled Ride' : 'Confirm Ride Now')}
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

                    {(activeTrip.status === 'ACCEPTED' || activeTrip.status === 'ARRIVED') && (
                      <div style={{ background: 'rgba(255, 204, 0, 0.1)', border: '1px solid rgba(255, 204, 0, 0.3)', borderRadius: '8px', padding: '12px', textAlign: 'center', marginTop: '14px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ride Start OTP (Share with Driver):</div>
                        <div style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '6px', color: 'var(--accent-cyan)', margin: '4px 0' }}>
                          {String(parseInt(activeTrip.id.replace(/-/g, '').substring(0, 4), 16) % 9000 + 1000)}
                        </div>
                      </div>
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
                  <span>Distance Travelled:</span>
                  <strong>{tripDistanceKm.toFixed(1)} km</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '10px', fontSize: '16px', fontWeight: '700' }}>
                  <span>Total Bill Amount:</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>₹{invoice.fare}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {invoice.paymentStatus === 'PENDING' ? (
                  <div style={{ border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.01)', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--accent-cyan)' }}>
                      UPI Payment Gateway
                    </div>
                    
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
