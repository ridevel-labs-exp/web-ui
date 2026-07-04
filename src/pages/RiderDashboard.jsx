import React, { useState, useEffect } from 'react';
import { tripService } from '../services/tripService';
import { telemetryService } from '../services/telemetryService';
import { authService } from '../services/authService';
import CabMap from '../components/CabMap';
import { MapPin, Navigation, Compass, CheckCircle2, Download, RefreshCw, Calendar, Clock, LocateFixed, Info, User, LogOut, ChevronRight } from 'lucide-react';

// City Database with popular locations across India
const CITIES_DATA = {
  Chennai: {
    center: { lat: 13.0827, lng: 80.2707 },
    landmarks: [
      { name: 'Chennai International Airport (MAA)', lat: 12.9941, lng: 80.1709 },
      { name: 'Chennai Central Railway Station (MAS)', lat: 13.0827, lng: 80.2707 },
      { name: 'T. Nagar Commercial Hub', lat: 13.0418, lng: 80.2341 },
      { name: 'OMR IT Corridor (Taramani/Perungudi)', lat: 12.9698, lng: 80.2443 },
      { name: 'Anna Nagar Roundtana', lat: 13.0850, lng: 80.2101 },
      { name: 'ECR Beach Road (Thiruvanmiyur)', lat: 12.9830, lng: 80.2594 },
      { name: 'Guindy Industrial Estate', lat: 13.0102, lng: 80.2157 },
      { name: 'Velachery Hub', lat: 12.9759, lng: 80.2212 }
    ]
  },
  Bangalore: {
    center: { lat: 12.9716, lng: 77.5946 },
    landmarks: [
      { name: 'Kempegowda Int\'l Airport (BLR)', lat: 13.1986, lng: 77.7066 },
      { name: 'Bangalore Palace Center', lat: 12.9716, lng: 77.5946 },
      { name: 'Electronic City IT Park', lat: 12.8452, lng: 77.6602 },
      { name: 'Indiranagar 100ft Road', lat: 12.9784, lng: 77.6408 },
      { name: 'Whitefield ITPL', lat: 12.9870, lng: 77.7312 },
      { name: 'Koramangala Commercial Hub', lat: 12.9352, lng: 77.6245 }
    ]
  },
  Coimbatore: {
    center: { lat: 11.0168, lng: 76.9558 },
    landmarks: [
      { name: 'Coimbatore Int\'l Airport (CJB)', lat: 11.0300, lng: 77.0434 },
      { name: 'Coimbatore Junction Station', lat: 10.9980, lng: 76.9629 },
      { name: 'TIDEL Park Coimbatore', lat: 11.0247, lng: 77.0264 },
      { name: 'RS Puram Zone', lat: 11.0069, lng: 76.9507 }
    ]
  },
  Delhi: {
    center: { lat: 28.6139, lng: 77.2090 },
    landmarks: [
      { name: 'IGI Airport Terminal 3 (DEL)', lat: 28.5562, lng: 77.1000 },
      { name: 'Connaught Place Center', lat: 28.6315, lng: 77.2167 },
      { name: 'Cyber Hub Gurgaon', lat: 28.4950, lng: 77.0890 },
      { name: 'Noida Sector 62 IT Hub', lat: 28.6270, lng: 77.3720 }
    ]
  },
  Mumbai: {
    center: { lat: 19.0760, lng: 72.8777 },
    landmarks: [
      { name: 'Chhatrapati Shivaji Airport (BOM)', lat: 19.0896, lng: 72.8656 },
      { name: 'Bandra Kurla Complex (BKC)', lat: 19.0660, lng: 72.8690 },
      { name: 'Marine Drive Promenade', lat: 18.9438, lng: 72.8230 },
      { name: 'Andheri Commercial Hub', lat: 19.1136, lng: 72.8461 }
    ]
  },
  Kolkata: {
    center: { lat: 22.5726, lng: 88.3639 },
    landmarks: [
      { name: 'Netaji Subhash Airport (CCU)', lat: 22.6547, lng: 88.4467 },
      { name: 'Park Street Hub', lat: 22.5530, lng: 88.3520 },
      { name: 'Salt Lake Sector V', lat: 22.5790, lng: 88.4340 }
    ]
  },
  Hyderabad: {
    center: { lat: 17.3850, lng: 78.4867 },
    landmarks: [
      { name: 'Rajiv Gandhi Int\'l Airport (HYD)', lat: 17.2403, lng: 78.4294 },
      { name: 'HITEC City Cyber Towers', lat: 17.4504, lng: 78.3808 },
      { name: 'Banjara Hills', lat: 17.4156, lng: 78.4489 }
    ]
  }
};

// Uber-style realistic vehicle categories
const VEHICLE_TYPES = [
  {
    id: 'SEDAN',
    name: 'Uber Sedan',
    subName: 'Dzire • Etios',
    tagline: 'Affordable, executive sedans',
    baseFare: 50,
    ratePerKm: 18,
    etaMin: '3 min',
    capacity: 4,
    color: '#FACC15',
    image: '/assets/sedan.png'
  },
  {
    id: 'HATCHBACK',
    name: 'Uber Go',
    subName: 'Swift • WagonR',
    tagline: 'Compact, daily rides',
    baseFare: 30,
    ratePerKm: 14,
    etaMin: '2 min',
    capacity: 4,
    color: '#4ADE80',
    image: '/assets/hatchback.png'
  },
  {
    id: 'SUV',
    name: 'UberXL SUV',
    subName: 'Ertiga • Innova',
    tagline: 'Spacious 6-seater for family & bags',
    baseFare: 80,
    ratePerKm: 24,
    etaMin: '5 min',
    capacity: 6,
    color: '#EF4444',
    image: '/assets/suv.png'
  },
  {
    id: 'PREMIER',
    name: 'Uber Black',
    subName: 'Camry • Superb',
    tagline: 'Top-rated drivers & luxury cars',
    baseFare: 120,
    ratePerKm: 32,
    etaMin: '4 min',
    capacity: 4,
    color: '#38BDF8',
    image: '/assets/luxury.png'
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

  // Schedule / Reserve State
  const [bookingMode, setBookingMode] = useState('NOW'); // 'NOW' or 'RESERVE'
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

          setPickup({
            lat: userLat,
            lng: userLng,
            address: `Current Location`
          });
        },
        (err) => {
          setDetectingLoc(false);
          const cityCenter = CITIES_DATA['Chennai'].center;
          setPickup({
            lat: cityCenter.lat,
            lng: cityCenter.lng,
            address: 'Chennai Central Hub'
          });
        },
        { timeout: 8000 }
      );
    }
  }, []);

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

  const tripDistanceKm = pickup && drop ? calculateHaversineKm(pickup.lat, pickup.lng, drop.lat, drop.lng) : 0;

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
        isScheduled: bookingMode === 'RESERVE',
        scheduledDateTime: bookingMode === 'RESERVE' ? `${scheduledDate} ${scheduledTime}` : null
      });
      setActiveTrip(response);
    } catch (err) {
      setError(err.response?.data?.error || 'No drivers available in your area. Try again.');
    } finally {
      setLoading(false);
    }
  };

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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#090D16', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Navbar */}
      <header style={{ height: '60px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#0F172A', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Uber <span style={{ fontSize: '10px', background: '#FACC15', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>RIDEVEL</span>
          </div>

          {/* City Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <MapPin size={14} style={{ color: '#FACC15' }} />
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                const city = CITIES_DATA[e.target.value];
                if (city) {
                  setPickup({ lat: city.center.lat, lng: city.center.lng, address: `${e.target.value} Center` });
                  setDrop(null);
                }
              }}
              style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '13px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
            >
              {Object.keys(CITIES_DATA).map((c) => (
                <option key={c} value={c} style={{ background: '#0F172A', color: '#FFFFFF' }}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={16} /> {user?.name || user?.email || 'Rider Account'}
          </div>
          <button onClick={authService.logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Grid: Left Booking Panel + Right Full Map */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', overflow: 'hidden' }}>
        
        {/* Left Control Column */}
        <div style={{ padding: '20px', overflowY: 'auto', background: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!activeTrip && !invoice && (
            <>
              {/* Ride Now vs Reserve Mode Switch */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setBookingMode('NOW')}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: bookingMode === 'NOW' ? '#FFFFFF' : 'transparent',
                    color: bookingMode === 'NOW' ? '#000000' : 'rgba(255,255,255,0.7)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Navigation size={14} /> Ride Now
                </button>
                <button
                  onClick={() => setBookingMode('RESERVE')}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: bookingMode === 'RESERVE' ? '#FFFFFF' : 'transparent',
                    color: bookingMode === 'RESERVE' ? '#000000' : 'rgba(255,255,255,0.7)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Calendar size={14} /> Reserve Later
                </button>
              </div>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              {/* Uber-Style Connected Location Selector */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                
                {/* Visual Connector Line */}
                <div style={{ position: 'absolute', left: '25px', top: '34px', bottom: '34px', width: '2px', background: 'rgba(255,255,255,0.2)', zIndex: 1 }} />

                {/* 🟢 Pickup Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', position: 'relative', zIndex: 2 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pickup Location</div>
                    <select
                      value={pickup ? pickup.address : ''}
                      onChange={(e) => {
                        const lm = currentCityData.landmarks.find((l) => l.name === e.target.value);
                        if (lm) setPickup({ lat: lm.lat, lng: lm.lng, address: lm.name });
                      }}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', outline: 'none', cursor: 'pointer', padding: '4px 0' }}
                    >
                      {pickup && <option value={pickup.address}>{pickup.address}</option>}
                      <option value="" disabled>Choose pickup landmark...</option>
                      {currentCityData.landmarks.map((l) => (
                        <option key={l.name} value={l.name} style={{ background: '#0F172A', color: '#FFFFFF' }}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', margin: '0 0 14px 24px' }} />

                {/* 🔴 Drop Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
                  <div style={{ width: '10px', height: '10px', background: '#EF4444', boxShadow: '0 0 8px #EF4444', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Where to?</div>
                    <select
                      value={drop ? drop.address : ''}
                      onChange={(e) => {
                        const lm = currentCityData.landmarks.find((l) => l.name === e.target.value);
                        if (lm) setDrop({ lat: lm.lat, lng: lm.lng, address: lm.name });
                      }}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', outline: 'none', cursor: 'pointer', padding: '4px 0' }}
                    >
                      <option value="" disabled>Select drop destination in {selectedCity}...</option>
                      {currentCityData.landmarks.map((l) => (
                        <option key={l.name} value={l.name} style={{ background: '#0F172A', color: '#FFFFFF' }}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Reserve Date & Time Picker */}
              {bookingMode === 'RESERVE' && (
                <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#38BDF8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> Select Future Date & Time
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
                    <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
                  </div>
                </div>
              )}

              {/* Uber Car Selection List */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>Available Cabs Nearby</div>
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
                          borderRadius: '12px',
                          border: isSelected ? `2px solid ${v.color}` : '1px solid rgba(255,255,255,0.08)',
                          background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease-in-out'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img src={v.image} alt={v.name} style={{ width: '56px', height: '36px', objectFit: 'contain' }} />
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF' }}>{v.name}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{v.subName} • {v.etaMin}</div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '17px', fontWeight: '800', color: isSelected ? v.color : '#FFFFFF' }}>
                            ₹{estimatedFare}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>₹{v.ratePerKm}/km</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 1 km Buffer Policy Callout */}
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
                <Info size={14} style={{ color: '#38BDF8', flexShrink: 0, marginTop: '2px' }} />
                <span>Variations under 1 km carry no extra charge. Distance exceeding 1 km is added at standard per-km rate upon ride completion.</span>
              </div>

              {/* Confirm Booking Button */}
              <button
                onClick={handleBookTrip}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(255,255,255,0.15)'
                }}
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : `Request ${selectedVehicle} Ride`}
              </button>
            </>
          )}

          {/* Active Trip Status Card */}
          {activeTrip && !invoice && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #38BDF8', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Ride Status</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
                <span>Status:</span>
                <span style={{ fontWeight: '700', color: '#38BDF8' }}>{activeTrip.status}</span>
              </div>

              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <div>🟢 <strong>Pickup:</strong> {activeTrip.pickupAddress}</div>
                <div>🔴 <strong>Drop:</strong> {activeTrip.dropAddress}</div>
              </div>

              {activeTrip.driverId ? (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Assigned Driver:</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginTop: '2px' }}>
                    Driver Ref: {activeTrip.driverId.substring(0, 8)}...
                  </div>

                  {(activeTrip.status === 'ACCEPTED' || activeTrip.status === 'ARRIVED') && (
                    <div style={{ background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: '8px', padding: '12px', textAlign: 'center', marginTop: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Share Start OTP with Driver:</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '4px', color: '#FACC15', margin: '4px 0' }}>
                        {String(parseInt(activeTrip.id.replace(/-/g, '').substring(0, 4), 16) % 9000 + 1000)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  <RefreshCw className="animate-spin" size={14} /> Searching for nearest driver...
                </div>
              )}
            </div>
          )}

          {/* Invoice & Payment Screen */}
          {invoice && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #22C55E', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <CheckCircle2 size={40} style={{ color: '#22C55E', margin: '0 auto 8px auto' }} />
                <h3 style={{ margin: 0, fontSize: '18px' }}>Trip Completed</h3>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Invoice Ref: {invoice.id.substring(0, 8)}...</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Distance:</span>
                  <strong>{tripDistanceKm.toFixed(1)} km</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', fontSize: '15px', fontWeight: '800' }}>
                  <span>Total Amount:</span>
                  <span style={{ color: '#38BDF8' }}>₹{invoice.fare}</span>
                </div>
              </div>

              {invoice.paymentStatus === 'PENDING' ? (
                <button onClick={handlePay} disabled={paying} style={{ width: '100%', padding: '12px', background: '#22C55E', color: '#000000', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginBottom: '8px' }}>
                  {paying ? 'Processing UPI Payment...' : 'Pay via UPI'}
                </button>
              ) : (
                <div style={{ textAlign: 'center', color: '#22C55E', fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>
                  ✓ Paid via UPI
                </div>
              )}

              <button onClick={resetDashboard} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                Book Another Ride
              </button>
            </div>
          )}

        </div>

        {/* Right Map View */}
        <div style={{ position: 'relative', height: '100%' }}>
          <CabMap pickup={pickup} drop={drop} driver={driverLoc} />
        </div>

      </div>
    </div>
  );
}
