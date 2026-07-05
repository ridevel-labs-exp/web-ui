import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tripService } from '../services/tripService';
import { telemetryService } from '../services/telemetryService';
import { authService } from '../services/authService';
import CabMap from '../components/CabMap';
import { MapPin, Navigation, Compass, CheckCircle2, Download, RefreshCw, Calendar, Clock, LocateFixed, Info, User, LogOut, Search, X, Users } from 'lucide-react';

// City Database with popular locations across India
const CITIES_DATA = {
  Chennai: {
    center: { lat: 13.0827, lng: 80.2707 },
    state: 'Tamil Nadu',
    landmarks: [
      { name: 'Kundrathur', fullAddress: 'Chennai, Tamil Nadu, India', lat: 12.9977, lng: 80.0972 },
      { name: 'KUNDRATHUR MURUGAN TEMPLE', fullAddress: 'Kundrathur, Chennai, Tamil Nadu, India', lat: 12.9998, lng: 80.0945 },
      { name: 'Kundrathur Bus Stand', fullAddress: 'Kundrathur Bus Stand Road, Chennai, Tamil Nadu, India', lat: 12.9975, lng: 80.0968 },
      { name: 'Pammal', fullAddress: 'Pammal Main Road, Chennai, Tamil Nadu, India', lat: 12.9818, lng: 80.1340 },
      { name: 'Perungudi', fullAddress: 'Chennai, Tamil Nadu, India', lat: 12.9698, lng: 80.2443 },
      { name: 'Chennai International Airport (MAA)', fullAddress: 'Meenambakkam, Chennai, Tamil Nadu, India', lat: 12.9941, lng: 80.1709 },
      { name: 'Chennai Central Railway Station (MAS)', fullAddress: 'Park Town, Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707 },
      { name: 'T. Nagar Commercial Hub', fullAddress: 'Thyagaraya Nagar, Chennai, Tamil Nadu, India', lat: 13.0418, lng: 80.2341 }
    ]
  },
  Bangalore: {
    center: { lat: 12.9716, lng: 77.5946 },
    state: 'Karnataka',
    landmarks: [
      { name: 'Kempegowda Int\'l Airport (BLR)', fullAddress: 'Devanahalli, Bangalore, Karnataka, India', lat: 13.1986, lng: 77.7066 },
      { name: 'MG Road Metro Station', fullAddress: 'MG Road, Bangalore, Karnataka, India', lat: 12.9730, lng: 77.6070 },
      { name: 'Electronic City IT Park', fullAddress: 'Electronic City, Bangalore, Karnataka, India', lat: 12.8452, lng: 77.6602 },
      { name: 'Indiranagar 100ft Road', fullAddress: 'Indiranagar, Bangalore, Karnataka, India', lat: 12.9784, lng: 77.6408 }
    ]
  },
  Coimbatore: {
    center: { lat: 11.0168, lng: 76.9558 },
    state: 'Tamil Nadu',
    landmarks: [
      { name: 'Coimbatore Int\'l Airport (CJB)', fullAddress: 'Peelamedu, Coimbatore, Tamil Nadu, India', lat: 11.0300, lng: 77.0434 },
      { name: 'Coimbatore Junction Station', fullAddress: 'Gopalapuram, Coimbatore, Tamil Nadu, India', lat: 10.9980, lng: 76.9629 },
      { name: 'TIDEL Park Coimbatore', fullAddress: 'Peelamedu, Coimbatore, Tamil Nadu, India', lat: 11.0247, lng: 77.0264 }
    ]
  },
  Delhi: {
    center: { lat: 28.6139, lng: 77.2090 },
    state: 'Delhi NCR',
    landmarks: [
      { name: 'IGI Airport Terminal 3 (DEL)', fullAddress: 'New Delhi, Delhi, India', lat: 28.5562, lng: 77.1000 },
      { name: 'Connaught Place', fullAddress: 'New Delhi, Delhi, India', lat: 28.6315, lng: 77.2167 },
      { name: 'Cyber Hub Gurgaon', fullAddress: 'Gurgaon, Haryana, India', lat: 28.4950, lng: 77.0890 }
    ]
  },
  Mumbai: {
    center: { lat: 19.0760, lng: 72.8777 },
    state: 'Maharashtra',
    landmarks: [
      { name: 'Chhatrapati Shivaji Airport (BOM)', fullAddress: 'Andheri East, Mumbai, Maharashtra, India', lat: 19.0896, lng: 72.8656 },
      { name: 'Bandra Kurla Complex (BKC)', fullAddress: 'Bandra East, Mumbai, Maharashtra, India', lat: 19.0660, lng: 72.8690 }
    ]
  }
};

// 100% Ridevel Branded Vehicle Categories
const VEHICLE_TYPES = [
  {
    id: 'SEDAN',
    name: 'Go Sedan',
    tagline: 'Affordable sedans',
    baseFare: 50,
    ratePerKm: 18,
    etaMin: '3 mins away',
    capacity: 4,
    color: '#FACC15',
    image: '/assets/sedan.png'
  },
  {
    id: 'HATCHBACK',
    name: 'Ridevel Go',
    tagline: 'Compact daily rides',
    baseFare: 30,
    ratePerKm: 14,
    etaMin: '2 mins away',
    capacity: 4,
    color: '#4ADE80',
    image: '/assets/hatchback.png'
  },
  {
    id: 'SUV',
    name: 'Ridevel XL',
    tagline: 'Spacious 6-seater for family',
    baseFare: 80,
    ratePerKm: 24,
    etaMin: '5 mins away',
    capacity: 6,
    color: '#EF4444',
    image: '/assets/suv.png'
  },
  {
    id: 'PREMIER',
    name: 'Ridevel Premier',
    tagline: 'Top-rated drivers & luxury cars',
    baseFare: 120,
    ratePerKm: 32,
    etaMin: '4 mins away',
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

  // City Selection & Change City Modal
  const [selectedCity, setSelectedCity] = useState('Chennai');
  const [showCityModal, setShowCityModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [detectingLoc, setDetectingLoc] = useState(false);

  // Map markers state
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);

  // Address Input & Autocomplete State
  const [pickupInput, setPickupInput] = useState('');
  const [dropInput, setDropInput] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDrop, setSearchingDrop] = useState(false);
  const [dropdownRect, setDropdownRect] = useState(null);
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);

  // Vehicle Selection State
  const [selectedVehicle, setSelectedVehicle] = useState('SEDAN');

  // Schedule State
  const [bookingMode, setBookingMode] = useState('NOW'); // 'NOW' or 'RESERVE'
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Billing Invoice State
  const [invoice, setInvoice] = useState(null);
  const [paying, setPaying] = useState(false);

  // Reverse geocode & detect exact user GPS position
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setDetectingLoc(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            const data = await res.json();
            const adminParts = data.localityInfo?.administrative || [];
            const subParts = adminParts
              .filter(part => part.adminLevel > 2)
              .map(part => part.name);
            const addressName = subParts.length > 0 
              ? subParts.reverse().slice(0, 3).join(', ') 
              : (data.locality || `📍 GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

            setPickup({ lat, lng, address: addressName });
            setPickupInput(addressName);
          } catch (e) {
            setPickup({ lat, lng, address: `📍 GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
            setPickupInput(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          } finally {
            setDetectingLoc(false);
          }
        },
        (err) => {
          setDetectingLoc(false);
        },
        { timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    handleUseCurrentLocation();
  }, []);

  // Fetch live OSM address suggestions using Nominatim (locality-aware full text search)
  const searchAddress = async (query, type, inputRef) => {
    if (!query || query.length < 2) {
      if (type === 'pickup') setPickupSuggestions([]);
      else setDropSuggestions([]);
      setDropdownRect(null);
      return;
    }

    if (type === 'pickup') setSearchingPickup(true);
    else setSearchingDrop(true);

    // Capture input position for fixed dropdown placement
    if (inputRef?.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width, type });
    }

    try {
      const cityData = CITIES_DATA[selectedCity] || CITIES_DATA['Chennai'];
      const clat = cityData.center.lat;
      const clng = cityData.center.lng;

      // Use Nominatim for full-text locality-aware search (handles "Street Name City" queries correctly)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=IN&format=json&limit=6&addressdetails=1&viewbox=${clng - 1.5},${clat + 1.5},${clng + 1.5},${clat - 1.5}`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'RidevelApp/1.0' } }
      );
      const results = await res.json();

      const formatted = results.map((item) => {
        const addr = item.address || {};
        const titleParts = [addr.road || addr.pedestrian || addr.footway || item.name].filter(Boolean);
        const title = titleParts[0] || item.display_name.split(',')[0];
        const subtitleParts = [
          addr.suburb || addr.neighbourhood,
          addr.city || addr.town || addr.village || addr.county,
          addr.state,
          addr.country
        ].filter(Boolean);
        const subtitle = subtitleParts.join(', ');
        return {
          title,
          subtitle,
          fullAddress: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      });

      if (type === 'pickup') setPickupSuggestions(formatted);
      else setDropSuggestions(formatted);
    } catch (e) {
      console.error('Geocoding search failed', e);
    } finally {
      if (type === 'pickup') setSearchingPickup(false);
      else setSearchingDrop(false);
    }
  };

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
    setDropInput('');
    setDriverLoc(null);
    setInvoice(null);
  };

  // Get current time string for ride ETA calculation (e.g. 11:42 PM)
  const getEtaTimeString = (minsOffset) => {
    const d = new Date(Date.now() + minsOffset * 60 * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentCityData = CITIES_DATA[selectedCity] || CITIES_DATA['Chennai'];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* Top Navbar */}
      <header style={{ height: '60px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#FFFFFF', zIndex: 100, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Ridevel
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <User size={16} /> {user?.name || user?.email || 'Karthi'}
          </div>
          <button onClick={authService.logout} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* Main Grid: Left Control Panel + Right Full Height Map */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '430px 1fr', gap: '20px', padding: '20px', background: '#F8FAFC', overflow: 'hidden' }}>
        
        {/* Left Control Column */}
        <div style={{ padding: '24px', overflowY: 'auto', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          
          {!activeTrip && !invoice && (
            <>
              {/* Header Location Tag (Screenshot #2 Match: "📍 Chennai, IN  Change city") */}
              <div>
                <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                  <MapPin size={15} style={{ color: '#2563EB', fill: '#DBEAFE' }} />
                  <span>{selectedCity}, IN</span>
                  <button
                    onClick={() => setShowCityModal(true)}
                    style={{ background: 'none', border: 'none', color: '#2563EB', textDecoration: 'underline', fontSize: '13px', cursor: 'pointer', marginLeft: '4px', fontWeight: '600' }}
                  >
                    Change city
                  </button>
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', margin: '8px 0 16px 0', letterSpacing: '-0.5px' }}>
                  Request a ride
                </h1>
              </div>

              {/* Ride Now vs Reserve Mode Switch */}
              <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '4px', borderRadius: '24px', width: 'fit-content', marginBottom: '8px' }}>
                <button
                  onClick={() => setBookingMode('NOW')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    background: bookingMode === 'NOW' ? '#FFFFFF' : 'transparent',
                    color: bookingMode === 'NOW' ? '#0F172A' : '#64748B',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: bookingMode === 'NOW' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Clock size={14} /> Pickup now
                </button>
                <button
                  onClick={() => setBookingMode('RESERVE')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    background: bookingMode === 'RESERVE' ? '#FFFFFF' : 'transparent',
                    color: bookingMode === 'RESERVE' ? '#0F172A' : '#64748B',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: bookingMode === 'RESERVE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Calendar size={14} /> Reserve a ride
                </button>
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              {/* Connected Location Selector (Screenshot #3 & #4 Match) */}
              <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px', position: 'relative' }}>
                
                {/* Visual Connector Line */}
                <div style={{ position: 'absolute', left: '26px', top: '34px', bottom: '34px', width: '2px', background: '#E2E8F0', zIndex: 1 }} />

                {/* 🟢 Pickup Search Row */}
                <div style={{ position: 'relative', zIndex: 2, marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px', marginLeft: '26px' }}>Pickup location</div>

                  <div ref={pickupInputRef} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: `1.5px solid ${pickupSuggestions.length > 0 ? '#2563EB' : '#CBD5E1'}`, padding: '10px 14px', borderRadius: '8px', transition: 'border-color 0.2s' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 2px #E2E8F0', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Pickup location"
                      value={pickupInput}
                      onChange={(e) => {
                        setPickupInput(e.target.value);
                        searchAddress(e.target.value, 'pickup', pickupInputRef);
                      }}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#0F172A', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                    />
                    {pickupInput ? (
                      <X size={16} onClick={() => { setPickupInput(''); setPickup(null); setPickupSuggestions([]); setDropdownRect(null); }} style={{ cursor: 'pointer', color: '#64748B' }} />
                    ) : (
                      <LocateFixed size={16} onClick={handleUseCurrentLocation} style={{ cursor: 'pointer', color: '#2563EB' }} />
                    )}
                  </div>

                  {/* Pickup Autocomplete Dropdown — position:fixed to escape overflow:auto clipping */}
                  {pickupSuggestions.length > 0 && dropdownRect?.type === 'pickup' && (
                    <div style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', zIndex: 9999, boxShadow: '0 20px 40px -8px rgba(0,0,0,0.15)', maxHeight: '260px', overflowY: 'auto' }}>
                      {pickupSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setPickup({ lat: item.lat, lng: item.lng, address: item.fullAddress });
                            setPickupInput(item.title);
                            setPickupSuggestions([]);
                            setDropdownRect(null);
                          }}
                          style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MapPin size={16} style={{ color: '#2563EB' }} />
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subtitle}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 🔴 Drop Search Row */}
                <div style={{ position: 'relative', zIndex: dropSuggestions.length > 0 ? 10 : 1 }}>
                  <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px', marginLeft: '26px' }}>Dropoff location</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1.5px solid #CBD5E1', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#EF4444', border: '2px solid #FFFFFF', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Dropoff location"
                      value={dropInput}
                      onChange={(e) => {
                        setDropInput(e.target.value);
                        searchAddress(e.target.value, 'drop');
                      }}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#0F172A', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                    />
                    {dropInput && (
                      <X size={16} onClick={() => { setDropInput(''); setDrop(null); }} style={{ cursor: 'pointer', color: '#64748B' }} />
                    )}
                  </div>

                  {/* Drop Autocomplete Dropdown List (Screenshot #4 Match) */}
                  {dropSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', marginTop: '4px', zIndex: 20, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', maxHeight: '250px', overflowY: 'auto' }}>
                      {dropSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setDrop({ lat: item.lat, lng: item.lng, address: item.title });
                            setDropInput(item.title);
                            setDropSuggestions([]);
                          }}
                          style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MapPin size={16} style={{ color: '#2563EB' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{item.title}</div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{item.subtitle}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Reserve Date & Time Picker */}
              {bookingMode === 'RESERVE' && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> Schedule Date & Time
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
                    <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
                  </div>
                </div>
              )}

              {/* Ridevel Vehicle Cards (Screenshot #1 Match) */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>Select Ride Category</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {VEHICLE_TYPES.map((v, idx) => {
                    const isSelected = selectedVehicle === v.id;
                    const estimatedFare = (v.baseFare + (tripDistanceKm > 0 ? v.ratePerKm * tripDistanceKm : 0)).toFixed(2);
                    const etaTime = getEtaTimeString(3 + idx * 2);

                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicle(v.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <img src={v.image} alt={v.name} style={{ width: '64px', height: '40px', objectFit: 'contain' }} />
                          <div>
                            <div style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {v.name}
                              <span style={{ fontSize: '12px', fontWeight: '500', color: '#475569', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Users size={12} /> {v.capacity}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                              {v.etaMin} • {etaTime}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>{v.tagline}</div>
                          </div>
                        </div>

                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>
                          ₹{estimatedFare}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confirm Ride Button */}
              <button
                onClick={handleBookTrip}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  marginTop: '6px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                }}
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : `Request ${selectedVehicle} Ride`}
              </button>
            </>
          )}

          {/* Active Trip Status Card */}
          {activeTrip && !invoice && (
            <div style={{ background: '#FFFFFF', borderLeft: '4px solid #2563EB', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '14px', color: '#0F172A' }}>Ride Status</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', marginBottom: '14px' }}>
                <span>Matching Status:</span>
                <span style={{ fontWeight: '800', color: '#2563EB' }}>{activeTrip.status}</span>
              </div>

              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', color: '#334155' }}>
                <div>🟢 <strong>Pickup:</strong> {activeTrip.pickupAddress}</div>
                <div>🔴 <strong>Drop:</strong> {activeTrip.dropAddress}</div>
              </div>

              {activeTrip.driverId ? (
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Assigned Driver:</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                    Driver Ref: {activeTrip.driverId.substring(0, 8)}...
                  </div>

                  {(activeTrip.status === 'ACCEPTED' || activeTrip.status === 'ARRIVED') && (
                    <div style={{ background: '#FEF9C3', border: '1px solid #FEF08A', borderRadius: '10px', padding: '14px', textAlign: 'center', marginTop: '14px' }}>
                      <div style={{ fontSize: '11px', color: '#854D0E', textTransform: 'uppercase', fontWeight: '600' }}>Share Start OTP with Driver:</div>
                      <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '6px', color: '#854D0E', margin: '6px 0' }}>
                        {String(parseInt(activeTrip.id.replace(/-/g, '').substring(0, 4), 16) % 9000 + 1000)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
                  <RefreshCw className="animate-spin" size={16} /> Searching for nearest Ridevel driver...
                </div>
              )}
            </div>
          )}

          {/* Invoice & Payment Screen */}
          {invoice && (
            <div style={{ background: '#FFFFFF', borderLeft: '4px solid #22C55E', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <CheckCircle2 size={44} style={{ color: '#22C55E', margin: '0 auto 8px auto' }} />
                <h3 style={{ margin: 0, fontSize: '20px', color: '#0F172A' }}>Trip Completed</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Invoice Ref: {invoice.id.substring(0, 8)}...</span>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Distance Travelled:</span>
                  <strong>{tripDistanceKm.toFixed(1)} km</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '10px', fontSize: '18px', fontWeight: '900' }}>
                  <span>Total Amount:</span>
                  <span style={{ color: '#2563EB' }}>₹{invoice.fare}</span>
                </div>
              </div>

              {invoice.paymentStatus === 'PENDING' ? (
                <button onClick={handlePay} disabled={paying} style={{ width: '100%', padding: '14px', background: '#22C55E', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', marginBottom: '10px' }}>
                  {paying ? 'Processing UPI Payment...' : 'Pay via UPI App'}
                </button>
              ) : (
                <div style={{ textAlign: 'center', color: '#22C55E', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>
                  ✓ Paid via UPI
                </div>
              )}

              <button onClick={resetDashboard} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                Book Another Ride
              </button>
            </div>
          )}

        </div>

        {/* Right Map View */}
        <div style={{ position: 'relative', height: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <CabMap pickup={pickup} drop={drop} driver={driverLoc} />
        </div>

      </div>

      {/* City Switcher Modal Popup (Screenshot #2 Match) */}
      {showCityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', width: '400px', maxWidth: '90vw', color: '#0F172A', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Select City</h3>
              <X size={20} onClick={() => setShowCityModal(false)} style={{ cursor: 'pointer', color: '#64748B' }} />
            </div>

            <input
              type="text"
              placeholder="Search city in India..."
              value={citySearchQuery}
              onChange={(e) => setCitySearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0F172A', fontSize: '14px', marginBottom: '16px', outline: 'none' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {Object.keys(CITIES_DATA)
                .filter((c) => c.toLowerCase().includes(citySearchQuery.toLowerCase()))
                .map((city) => (
                  <div
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      const cData = CITIES_DATA[city];
                      if (cData) {
                        setPickup({ lat: cData.center.lat, lng: cData.center.lng, address: `${city} Center` });
                        setPickupInput(`${city} Center`);
                        setDrop(null);
                        setDropInput('');
                      }
                      setShowCityModal(false);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: selectedCity === city ? '#EFF6FF' : '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      color: selectedCity === city ? '#2563EB' : '#0F172A',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: selectedCity === city ? '700' : '400'
                    }}
                  >
                    <span>📍 {city}, {CITIES_DATA[city].state}</span>
                    {selectedCity === city && <span style={{ color: '#2563EB', fontSize: '12px', fontWeight: '700' }}>Active</span>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
