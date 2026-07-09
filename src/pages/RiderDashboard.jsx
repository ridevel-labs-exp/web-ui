import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tripService } from '../services/tripService';
import { telemetryService } from '../services/telemetryService';
import { authService } from '../services/authService';
import CabMap from '../components/CabMap';
import BrandedLoader from '../components/BrandedLoader';
import { Search, MapPin, Navigation, ArrowRight, CheckCircle2, ShieldCheck, Clock, Award, Users, ChevronRight, ChevronDown, AlertTriangle, X, Calendar, Filter, UserCheck, Car, RefreshCw, Download, LocateFixed, Info, User, LogOut, HelpCircle, LifeBuoy } from 'lucide-react';

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
    name: 'Dzire Sedan',
    tagline: 'Comfortable 4-seater Swift Dzire',
    baseFare: 50,
    ratePerKm: 22,
    etaMin: '3 mins away',
    capacity: 4,
    color: '#FACC15',
    active: true
  },
  {
    id: 'HATCHBACK',
    name: 'Ridevel Mini',
    tagline: 'Coming Soon',
    baseFare: 30,
    ratePerKm: 14,
    etaMin: 'Unavailable',
    capacity: 4,
    color: '#94A3B8',
    active: false
  },
  {
    id: 'SUV',
    name: 'Ridevel XL',
    tagline: 'Coming Soon',
    baseFare: 80,
    ratePerKm: 28,
    etaMin: 'Unavailable',
    capacity: 6,
    color: '#94A3B8',
    active: false
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
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 992 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Profile & Ride History State
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [riderHistory, setRiderHistory] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Manage Account & Privacy, Legal, Help Modals State
  const [showManageAccountModal, setShowManageAccountModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [privacyTab, setPrivacyTab] = useState('data'); // 'data' | 'other'
  const [privacySettings, setPrivacySettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ridevel_privacy_settings');
      return saved ? JSON.parse(saved) : {
        shareLocation: true,
        personalizedAds: false,
        thirdPartySharing: false,
        twoFactorAuth: false,
        incognito: false,
        marketingEmails: true
      };
    } catch (e) {
      return {
        shareLocation: true,
        personalizedAds: false,
        thirdPartySharing: false,
        twoFactorAuth: false,
        incognito: false,
        marketingEmails: true
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ridevel_privacy_settings', JSON.stringify(privacySettings));
    } catch (e) {
      console.error('Failed to save privacy settings', e);
    }
  }, [privacySettings]);

  const handleTogglePrivacy = (key) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleOpenActivity = async () => {
    setShowActivityModal(true);
    setActivityLoading(true);
    try {
      const history = await tripService.getRiderTrips();
      // Sort history descending by creation date (newest first)
      const sortedHistory = (history || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRiderHistory(sortedHistory);
    } catch (err) {
      console.error("Failed to load rider history", err);
    } finally {
      setActivityLoading(false);
    }
  };

  // City Selection & Change City Modal
  const [selectedCity, setSelectedCity] = useState('Chennai');
  const [showCityModal, setShowCityModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [detectingLoc, setDetectingLoc] = useState(false);

  // Map markers state
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [isRerouting, setIsRerouting] = useState(false);

  // Address Input & Autocomplete State
  const [pickupInput, setPickupInput] = useState('');
  const [dropInput, setDropInput] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDrop, setSearchingDrop] = useState(false);
  const [dropdownRect, setDropdownRect] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [mapSelectMode, setMapSelectMode] = useState(null); // 'pickup' | 'drop' | null
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Load Recent Searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ridevel_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  const saveRecentSearch = (item) => {
    try {
      const updated = [item, ...recentSearches.filter(r => r.fullAddress !== item.fullAddress)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('ridevel_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search', e);
    }
  };

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

  // Reverse geocode map click coordinates
  const handleMapClick = async (lat, lng) => {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await res.json();
      const adminParts = data.localityInfo?.administrative || [];
      const subParts = adminParts
        .filter(part => part.adminLevel > 2)
        .map(part => part.name);
      const addressName = subParts.length > 0 
        ? subParts.reverse().slice(0, 3).join(', ') 
        : (data.locality || `📍 Pin Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

      const locObj = { lat, lng, address: addressName };

      if (mapSelectMode === 'drop') {
        setDrop(locObj);
        setDropInput(addressName);
        saveRecentSearch({ title: addressName, subtitle: 'Selected from map', fullAddress: addressName, lat, lng });
        setMapSelectMode(null);
        setSelectedMapLocation(null);
      } else if (mapSelectMode === 'pickup') {
        setPickup(locObj);
        setPickupInput(addressName);
        saveRecentSearch({ title: addressName, subtitle: 'Selected from map', fullAddress: addressName, lat, lng });
        setMapSelectMode(null);
        setSelectedMapLocation(null);
      } else {
        setSelectedMapLocation(locObj);
      }
    } catch (e) {
      console.error('Reverse geocode failed', e);
    }
  };

  useEffect(() => {
    handleUseCurrentLocation();
  }, []);

  // Debounced search with Photon (fast autocomplete with proximity bias) + Nominatim fallback
  const searchAddress = (query, type, inputRef) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (inputRef?.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width, type });
    }

    if (!query || query.trim().length < 2) {
      // If query is short/empty, show recent searches & landmarks
      const cityData = CITIES_DATA[selectedCity] || CITIES_DATA['Chennai'];
      const defaultSuggestions = [
        ...recentSearches.map(r => ({ ...r, isRecent: true })),
        ...cityData.landmarks.map(l => ({
          title: l.name,
          subtitle: l.fullAddress,
          fullAddress: `${l.name}, ${l.fullAddress}`,
          lat: l.lat,
          lng: l.lng,
          isLandmark: true
        }))
      ];
      if (type === 'pickup') setPickupSuggestions(defaultSuggestions.slice(0, 6));
      else setDropSuggestions(defaultSuggestions.slice(0, 6));
      return;
    }

    if (type === 'pickup') setSearchingPickup(true);
    else setSearchingDrop(true);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const cityData = CITIES_DATA[selectedCity] || CITIES_DATA['Chennai'];
        // Use user's current GPS position if available for proximity bias, else city center
        const lat = pickup?.lat || cityData.center.lat;
        const lng = pickup?.lng || cityData.center.lng;

        // Try Photon API first (fast, location-biased search-as-you-type)
        let res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${lat}&lon=${lng}&limit=8&countrycode=IN`);
        let data = await res.json();
        let features = data.features || [];

        let formatted = features.map((item) => {
          const p = item.properties;
          const title = p.name || p.street || query;
          const subtitleParts = [
            p.street !== title ? p.street : null,
            p.district !== title ? p.district : null,
            p.city !== p.district && p.city !== title ? p.city : null,
            p.county !== p.city && p.county !== p.district ? p.county : null,
            p.state,
            p.country
          ].filter(Boolean);
          const subtitle = subtitleParts.join(', ');

          return {
            title,
            subtitle: subtitle || 'India',
            fullAddress: subtitle ? `${title}, ${subtitle}` : title,
            lat: item.geometry.coordinates[1],
            lng: item.geometry.coordinates[0]
          };
        });

        // Fallback to Nominatim if Photon returns empty results
        if (formatted.length === 0) {
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=IN&format=json&limit=8&addressdetails=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'RidevelApp/1.0' } }
          );
          const nomResults = await nomRes.json();
          formatted = nomResults.map((item) => {
            const addr = item.address || {};
            const title = addr.road || addr.pedestrian || addr.footway || item.name || item.display_name.split(',')[0];
            const subtitleParts = [
              addr.suburb || addr.neighbourhood,
              addr.city || addr.town || addr.village || addr.county,
              addr.state,
              addr.country
            ].filter(Boolean);
            const subtitle = subtitleParts.join(', ');
            return {
              title,
              subtitle: subtitle || item.display_name,
              fullAddress: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            };
          });
        }

        if (type === 'pickup') setPickupSuggestions(formatted);
        else setDropSuggestions(formatted);
      } catch (e) {
        console.error('Geocoding search failed', e);
      } finally {
        if (type === 'pickup') setSearchingPickup(false);
        else setSearchingDrop(false);
      }
    }, 300);
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

  const [noDriverModal, setNoDriverModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' or 'UPI'
  const [showUpiQrModal, setShowUpiQrModal] = useState(false);

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

      // If instant booking (NOW) and no driver matched within 10km, display unavailability modal
      if (bookingMode === 'NOW' && !response.driverId) {
        setNoDriverModal(true);
      } else {
        setActiveTrip(response);
      }
    } catch (err) {
      if (bookingMode === 'NOW') {
        setNoDriverModal(true);
      } else {
        setError(err.response?.data?.error || 'No drivers available in your area. Try again.');
      }
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
      <header style={{
        height: isMobile ? '54px' : '60px',
        borderBottom: isMobile ? 'none' : '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 24px',
        background: '#FFFFFF',
        zIndex: 1000,
        boxShadow: isMobile ? '0 4px 20px rgba(0, 0, 0, 0.08)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        position: isMobile ? 'absolute' : 'relative',
        top: isMobile ? '12px' : '0',
        left: isMobile ? '12px' : '0',
        right: isMobile ? '12px' : '0',
        borderRadius: isMobile ? '30px' : '0',
        border: isMobile ? '1px solid #E2E8F0' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Ridevel
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Activity / Ride History Button */}
          <button
            onClick={handleOpenActivity}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: '20px',
              transition: 'background 0.15s ease'
            }}
          >
            <Clock size={16} /> Activity
          </button>

          {/* Profile Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#F1F5F9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: 0,
                overflow: 'hidden'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#E2E8F0',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={20} />
              </div>
            </button>

            {showProfileDropdown && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '320px',
                background: '#FFFFFF',
                borderRadius: '24px',
                boxShadow: '0 20px 40px -10px rgba(15,23,42,0.22)',
                border: '1px solid #F1F5F9',
                padding: '24px',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                textAlign: 'left'
              }}>
                {/* Header: Name and Avatar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: '900', 
                      color: '#0F172A', 
                      letterSpacing: '-0.5px',
                      wordBreak: 'break-word',
                      lineHeight: '1.2'
                    }}>
                      {user?.name || 'Rider'}
                    </div>
                  </div>
                  
                  {/* Large Profile Silhouette Avatar (Yellow Circle highlight in image) */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    flexShrink: 0
                  }}>
                    <User size={36} />
                  </div>
                </div>

                {/* Quick Actions Grid (Help & Activity) */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setShowHelpModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '16px 12px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F1F5F9';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <LifeBuoy size={20} style={{ color: '#0F172A' }} />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Help</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      handleOpenActivity();
                    }}
                    style={{
                      flex: 1,
                      padding: '16px 12px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F1F5F9';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <Clock size={20} style={{ color: '#0F172A' }} />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Activity</span>
                  </button>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: '#F1F5F9' }} />

                {/* Navigation Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Manage account option */}
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setShowManageAccountModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      padding: '10px 8px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <User size={18} style={{ color: '#64748B' }} />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Manage account</span>
                    </div>
                    <ChevronRight size={16} style={{ color: '#94A3B8' }} />
                  </button>

                  {/* Legal option */}
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setShowLegalModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      padding: '10px 8px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Info size={18} style={{ color: '#64748B' }} />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Legal</span>
                    </div>
                    <ChevronRight size={16} style={{ color: '#94A3B8' }} />
                  </button>
                </div>

                {/* Sign out button at the bottom */}
                <button
                  onClick={authService.logout}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#F1F5F9',
                    color: '#EF4444',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FEF2F2';
                    e.currentTarget.style.color = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F1F5F9';
                    e.currentTarget.style.color = '#EF4444';
                  }}
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid: Left Control Panel + Right Full Height Map */}
      <div style={{
        flex: 1,
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? 'none' : '430px 1fr',
        gap: isMobile ? '0' : '20px',
        padding: isMobile ? '0' : '20px',
        background: '#F8FAFC',
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* Left Control Column */}
        <div style={{
          padding: isMobile ? '16px' : '24px',
          overflowY: 'auto',
          background: '#FFFFFF',
          border: isMobile ? 'none' : '1px solid #E2E8F0',
          borderRadius: isMobile ? '24px 24px 0 0' : '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '14px' : '18px',
          boxShadow: isMobile ? '0 -8px 30px rgba(15,23,42,0.12)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
          position: isMobile ? 'absolute' : 'relative',
          bottom: isMobile ? '0' : 'auto',
          left: isMobile ? '0' : 'auto',
          right: isMobile ? '0' : 'auto',
          maxHeight: isMobile ? '45vh' : '100%',
          zIndex: 100
        }}>
          {isMobile && (
            <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', alignSelf: 'center', marginBottom: '8px', flexShrink: 0 }} />
          )}
          
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', marginLeft: '26px' }}>
                    <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pickup location</span>
                    <button
                      onClick={() => setMapSelectMode('pickup')}
                      style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <MapPin size={12} /> Set on map
                    </button>
                  </div>

                  <div ref={pickupInputRef} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: `1.5px solid ${pickupSuggestions.length > 0 && dropdownRect?.type === 'pickup' ? '#2563EB' : '#CBD5E1'}`, padding: '10px 14px', borderRadius: '8px', transition: 'border-color 0.2s' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 2px #E2E8F0', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Pickup location"
                      value={pickupInput}
                      onFocus={() => searchAddress(pickupInput, 'pickup', pickupInputRef)}
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
                      {pickupSuggestions.map((item, idx) => {
                        const displayTitle = item.title;
                        const displaySubtitle = item.subtitle;
                        const fullLabel = item.subtitle ? `${item.title}, ${item.subtitle}` : item.title;
                        return (
                          <div
                            key={idx}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setPickup({ lat: item.lat, lng: item.lng, address: fullLabel });
                              setPickupInput(fullLabel);
                              saveRecentSearch({ ...item, fullAddress: fullLabel });
                              setPickupSuggestions([]);
                              setDropdownRect(null);
                            }}
                            style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: item.isRecent ? '#F1F5F9' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <MapPin size={16} style={{ color: item.isRecent ? '#64748B' : '#2563EB' }} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {displayTitle} {item.isRecent && <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '500', marginLeft: '4px' }}>(Recent)</span>}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displaySubtitle}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 🔴 Drop Search Row */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', marginLeft: '26px' }}>
                    <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dropoff location</span>
                    <button
                      onClick={() => setMapSelectMode('drop')}
                      style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <MapPin size={12} /> Set on map
                    </button>
                  </div>

                  <div ref={dropInputRef} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: `1.5px solid ${dropSuggestions.length > 0 && dropdownRect?.type === 'drop' ? '#2563EB' : '#CBD5E1'}`, padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#EF4444', border: '2px solid #FFFFFF', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Where to?"
                      value={dropInput}
                      onFocus={() => searchAddress(dropInput, 'drop', dropInputRef)}
                      onChange={(e) => {
                        setDropInput(e.target.value);
                        searchAddress(e.target.value, 'drop', dropInputRef);
                      }}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#0F172A', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                    />
                    {dropInput && (
                      <X size={16} onClick={() => { setDropInput(''); setDrop(null); setDropSuggestions([]); setDropdownRect(null); }} style={{ cursor: 'pointer', color: '#64748B' }} />
                    )}
                  </div>

                  {/* Drop Autocomplete Dropdown — position:fixed to escape overflow:auto clipping */}
                  {dropSuggestions.length > 0 && dropdownRect?.type === 'drop' && (
                    <div style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', zIndex: 9999, boxShadow: '0 20px 40px -8px rgba(0,0,0,0.15)', maxHeight: '260px', overflowY: 'auto' }}>
                      {dropSuggestions.map((item, idx) => {
                        const displayTitle = item.title;
                        const displaySubtitle = item.subtitle;
                        const fullLabel = item.subtitle ? `${item.title}, ${item.subtitle}` : item.title;
                        return (
                          <div
                            key={idx}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setDrop({ lat: item.lat, lng: item.lng, address: fullLabel });
                              setDropInput(fullLabel);
                              saveRecentSearch({ ...item, fullAddress: fullLabel });
                              setDropSuggestions([]);
                              setDropdownRect(null);
                            }}
                            style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: item.isRecent ? '#F1F5F9' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <MapPin size={16} style={{ color: item.isRecent ? '#64748B' : '#2563EB' }} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {displayTitle} {item.isRecent && <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '500', marginLeft: '4px' }}>(Recent)</span>}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displaySubtitle}</div>
                            </div>
                          </div>
                        );
                      })}
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

                    return (
                      <div
                        key={v.id}
                        onClick={() => v.active && setSelectedVehicle(v.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                          background: !v.active ? '#F1F5F9' : (isSelected ? '#EFF6FF' : '#FFFFFF'),
                          opacity: !v.active ? 0.6 : 1,
                          cursor: !v.active ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '64px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg viewBox="0 0 100 60" width="60" height="42" style={{ display: 'block' }}>
                              {/* Underbody Shadow */}
                              <ellipse cx="48" cy="50" rx="42" ry="6" fill="#0F172A" opacity="0.3" />
                              
                              {/* Wheels */}
                              <ellipse cx="25" cy="43" rx="8" ry="7.5" fill="#1E293B" />
                              <ellipse cx="25" cy="43" rx="3.5" ry="3" fill="#E2E8F0" />
                              <ellipse cx="69" cy="46" rx="8" ry="7.5" fill="#1E293B" />
                              <ellipse cx="69" cy="46" rx="3.5" ry="3" fill="#E2E8F0" />
                              
                              {/* Main Body */}
                              <path d="M 12,32 
                                       C 12,32 10,25 15,20 
                                       C 20,15 28,15 28,15 
                                       L 42,12 
                                       C 42,12 55,7 72,18 
                                       C 89,29 95,35 95,38 
                                       C 95,41 90,44 82,45 
                                       C 74,46 58,47 52,47 
                                       C 46,47 20,44 14,40 
                                       C 10,38 12,32 12,32 Z" 
                                    fill={v.id === 'LUXURY' ? '#1E293B' : '#FFFFFF'} 
                                    stroke="#CBD5E1" 
                                    strokeWidth="1" />
                                    
                              {/* Black Panoramic Glass Roof & Canopy */}
                              <path d="M 28,15 
                                       C 28,15 36,9 50,8 
                                       C 64,7 74,13 74,13 
                                       L 62,24 
                                       C 62,24 55,27 45,26 
                                       C 35,25 24,19 24,19 Z" 
                                    fill="#0F172A" />
                                    
                              {/* Side Windows & Windshield */}
                              <path d="M 24,19 
                                       L 30,16 
                                       C 30,16 38,12 48,12 
                                       L 58,16 
                                       L 60,20 
                                       C 60,20 54,23 46,22 
                                       C 38,21 24,19 24,19 Z" 
                                    fill="#1E293B" 
                                    opacity="0.9" />
                                    
                              {/* Side Mirror */}
                              <ellipse cx="62" cy="20" rx="3" ry="2" fill="#0F172A" />
                              <ellipse cx="28" cy="18" rx="2" ry="1.5" fill="#0F172A" />
                              
                              {/* Headlight glow */}
                              <path d="M 91,38 C 93,39 95,40 95,41 C 94,41 92,41 90,40 Z" fill="#FBBF24" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {v.name}
                              {v.active ? (
                                <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <Users size={12} /> {v.capacity}
                                </span>
                              ) : (
                                <span style={{ fontSize: '10px', background: '#E2E8F0', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                                  Coming Soon
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{v.tagline}</div>
                          </div>
                        </div>

                        {v.active && (
                          <div style={{ fontSize: '20px', fontWeight: '900', color: '#2563EB' }}>
                            ₹{estimatedFare}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unified Payment & Request Bar (100% Uber Screenshot Match) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', background: '#FFFFFF', padding: '4px 0' }}>
                {/* Left: Cash / GPay Selector (No inner border, clean Uber style) */}
                <div
                  onClick={() => setPaymentMethod(prev => prev === 'CASH' ? 'UPI' : 'CASH')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '6px 8px'
                  }}
                >
                  <div style={{ width: '40px', height: '34px', borderRadius: '8px', background: paymentMethod === 'CASH' ? '#DCFCE7' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    {paymentMethod === 'CASH' ? '💵' : '📱'}
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                    {paymentMethod === 'CASH' ? 'Cash' : 'GPay'}
                  </span>
                  <ChevronDown size={18} style={{ color: '#0F172A', strokeWidth: '2.5' }} />
                </div>

                {/* Right: Solid Black Request Button (Single line, fixed height) */}
                <button
                  onClick={() => {
                    if (paymentMethod === 'UPI' && (pickup && drop)) {
                      const activeV = VEHICLE_TYPES.find(v => v.id === selectedVehicle);
                      const fare = (activeV.baseFare + (tripDistanceKm * activeV.ratePerKm)).toFixed(2);
                      const upiUri = `upi://pay?pa=ridevel@okicici&pn=Ridevel%20Mobility&am=${fare}&cu=INR&tn=Ridevel%20Cab%20Booking`;
                      if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
                        window.location.href = upiUri;
                      } else {
                        setShowUpiQrModal(true);
                      }
                    }
                    handleBookTrip();
                  }}
                  disabled={loading}
                  style={{
                    height: '52px',
                    padding: '0 24px',
                    background: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {loading ? 'Requesting...' : 'Request Dzire Sedan'}
                </button>
              </div>
            </>
          )}

          {/* Active Ride Tracking Card (100% Screenshot #2 Match) */}
          {activeTrip && !invoice && (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              
              {/* Header */}
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', marginBottom: '2px' }}>
                {activeTrip.status === 'REQUESTED' ? 'Ride requested' : (activeTrip.status === 'STARTED' ? 'Trip in progress' : 'Driver on the way')}
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
                {activeTrip.status === 'REQUESTED' ? 'Finding drivers nearby' : 'Your vehicle is en route'}
              </div>

              {/* Animated Progress Bar */}
              <div style={{ height: '3px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ width: '45%', height: '100%', background: '#2563EB', borderRadius: '2px' }} />
              </div>

              {/* Location Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', marginBottom: '24px', paddingLeft: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0F172A', marginTop: '4px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>PICKUP POINT</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{pickup?.address || activeTrip.pickupAddress}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#0F172A', marginTop: '4px', flexShrink: 0 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>DROP DESTINATION</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{drop?.address || activeTrip.dropAddress}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fare & Payment Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '24px', borderRadius: '4px', background: paymentMethod === 'CASH' ? '#DCFCE7' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                    {paymentMethod === 'CASH' ? '💵' : '📱'}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>₹{activeTrip.fare}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>{paymentMethod === 'CASH' ? 'Cash' : 'GPay'}</div>
                  </div>
                </div>

                {/* OTP Share Badge if assigned */}
                {(activeTrip.status === 'ACCEPTED' || activeTrip.status === 'ARRIVED') && (
                  <div style={{ background: '#FEF9C3', border: '1px solid #FEF08A', padding: '6px 14px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#854D0E', textTransform: 'uppercase' }}>START OTP</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#854D0E', letterSpacing: '3px' }}>
                      {String(parseInt(activeTrip.id.replace(/-/g, '').substring(0, 4), 16) % 9000 + 1000)}
                    </div>
                  </div>
                )}
              </div>

              {/* Cancel Button (Screenshot #2 Match) */}
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this ride request?')) {
                    setActiveTrip(null);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#F8FAFC',
                  color: '#DC2626',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Cancel ride
              </button>
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
        <div style={{
          position: isMobile ? 'absolute' : 'relative',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100%',
          borderRadius: isMobile ? '0' : '16px',
          overflow: 'hidden',
          border: isMobile ? 'none' : '1px solid #E2E8F0',
          boxShadow: isMobile ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.05)',
          zIndex: 1
        }}>
          <CabMap 
            pickup={pickup} 
            drop={drop} 
            driver={driverLoc} 
            onMapClick={handleMapClick} 
            onReroutingAlert={setIsRerouting}
          />

          {/* Reroute Safety Warning Banner */}
          {isRerouting && activeTrip && activeTrip.status === 'STARTED' && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#EF4444',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              zIndex: 1000,
              boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '2px solid #FFFFFF'
            }}>
              <AlertTriangle size={18} />
              <span>Safety Alert: Driver deviated from the suggested route!</span>
            </div>
          )}

          {/* Floating Map Selection Banner */}
          {mapSelectMode && (
            <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', background: '#0F172A', color: '#FFFFFF', padding: '10px 20px', borderRadius: '30px', fontSize: '13px', fontWeight: '700', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📍 Tap anywhere on the map to set {mapSelectMode === 'pickup' ? 'Pickup' : 'Dropoff'}</span>
              <button
                onClick={() => setMapSelectMode(null)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFFFFF', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Floating Selected Map Location Action Card */}
          {selectedMapLocation && !mapSelectMode && (
            <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 20px', zIndex: 1000, boxShadow: '0 20px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '320px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Selected Location</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{selectedMapLocation.address}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => {
                    setPickup(selectedMapLocation);
                    setPickupInput(selectedMapLocation.address);
                    saveRecentSearch({ title: selectedMapLocation.address, subtitle: 'Set from map', fullAddress: selectedMapLocation.address, lat: selectedMapLocation.lat, lng: selectedMapLocation.lng });
                    setSelectedMapLocation(null);
                  }}
                  style={{ background: '#10B981', color: '#FFFFFF', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Set as Pickup 🟢
                </button>
                <button
                  onClick={() => {
                    setDrop(selectedMapLocation);
                    setDropInput(selectedMapLocation.address);
                    saveRecentSearch({ title: selectedMapLocation.address, subtitle: 'Set from map', fullAddress: selectedMapLocation.address, lat: selectedMapLocation.lat, lng: selectedMapLocation.lng });
                    setSelectedMapLocation(null);
                  }}
                  style={{ background: '#EF4444', color: '#FFFFFF', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Set as Drop 🔴
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* City Switcher Modal Popup (Screenshot #2 Match) */}
      {showCityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: isMobile ? '16px' : '24px', width: '400px', maxWidth: '95vw', color: '#0F172A', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
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

      {/* No Driver Available 10km Radius Modal Popup */}
      {noDriverModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: isMobile ? '20px' : '28px', width: '420px', maxWidth: '95vw', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#FEF2F2', border: '2px solid #FCA5A5', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>No Drivers Nearby</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
              Sorry, due to driver unavailability, your ride cannot be taken right now. Please try again shortly or schedule a pickup for later.
            </p>
            <button
              onClick={() => setNoDriverModal(false)}
              style={{ width: '100%', padding: '14px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
            >
              Understand & Dismiss
            </button>
          </div>
        </div>
      )}
      {/* Google Pay / UPI Desktop QR Code Modal Overlay */}
      {showUpiQrModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: isMobile ? '20px' : '32px', width: '420px', maxWidth: '95vw', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '2px solid #2563EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>Pay with GPay / UPI</div>
              <X size={20} onClick={() => setShowUpiQrModal(false)} style={{ cursor: 'pointer', color: '#64748B' }} />
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 20px 0' }}>
              Scan this QR code using <strong>Google Pay</strong>, PhonePe, or Paytm on your phone to complete payment:
            </p>

            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'inline-block', marginBottom: '20px' }}>
              {(() => {
                const activeV = VEHICLE_TYPES.find(v => v.id === selectedVehicle);
                const fare = (activeV.baseFare + (tripDistanceKm * activeV.ratePerKm)).toFixed(2);
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=ridevel@okicici&pn=Ridevel%20Mobility&am=${fare}&cu=INR&tn=Ridevel%20Cab%20Booking`)}`;
                return <img src={qrUrl} alt="GPay QR Code" style={{ width: '200px', height: '200px', borderRadius: '8px' }} />;
              })()}
            </div>

            <div style={{ fontSize: '13px', fontWeight: '800', color: '#10B981', marginBottom: '20px' }}>
              📱 Open GPay → Scan QR Code → Pay
            </div>

            <button
              onClick={() => setShowUpiQrModal(false)}
              style={{ width: '100%', padding: '14px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}
            >
              Done & Continue
            </button>
          </div>
        </div>
      )}

      {/* Rider Activity / Ride History Modal */}
      {showActivityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: isMobile ? '20px' : '32px', width: '560px', maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>Your Activity</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>View your past rides and download invoices</p>
              </div>
              <X size={24} onClick={() => setShowActivityModal(false)} style={{ cursor: 'pointer', color: '#64748B' }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
              {activityLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '14px' }}>Loading your ride history...</div>
              ) : riderHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '14px' }}>
                  No past rides found. Start booking to see your activity here!
                </div>
              ) : (
                riderHistory.map((trip) => (
                  <div key={trip.id} style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Car size={16} style={{ color: '#2563EB' }} /> Dzire Sedan
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: trip.status === 'COMPLETED' ? '#D1FAE5' : trip.status === 'CANCELLED' ? '#FEE2E2' : '#DBEAFE',
                        color: trip.status === 'COMPLETED' ? '#065F46' : trip.status === 'CANCELLED' ? '#991B1B' : '#1E40AF'
                      }}>
                        {trip.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '2px solid #CBD5E1', paddingLeft: '10px', margin: '4px 0' }}>
                      <div>🟢 <strong>Pickup:</strong> {trip.pickupAddress}</div>
                      <div>🔴 <strong>Drop:</strong> {trip.dropAddress}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                        Date: {new Date(trip.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '10px', marginTop: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                        Fare: ₹{trip.fare}
                      </div>
                      
                      {trip.status === 'COMPLETED' && (
                        <a
                          href={tripService.getInvoicePdfUrl(trip.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#2563EB',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <Download size={14} /> Invoice PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowActivityModal(false)}
              style={{ width: '100%', padding: '14px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '20px' }}
            >
              Close Activity
            </button>
          </div>
        </div>
      )}

      {/* Manage Account & Privacy Modal */}
      {showManageAccountModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: isMobile ? '20px' : '32px', width: '560px', maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' }}>Account & Privacy Settings</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>Manage your data privacy and account preferences</p>
              </div>
              <button 
                onClick={() => setShowManageAccountModal(false)} 
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E2E8F0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F1F5F9'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs Selector */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
              <button
                onClick={() => setPrivacyTab('data')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: privacyTab === 'data' ? '#FFFFFF' : 'transparent',
                  color: privacyTab === 'data' ? '#0F172A' : '#64748B',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🔒 Data Privacy
              </button>
              <button
                onClick={() => setPrivacyTab('other')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: privacyTab === 'other' ? '#FFFFFF' : 'transparent',
                  color: privacyTab === 'other' ? '#0F172A' : '#64748B',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ⚙️ Other Privacy / Security
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px' }}>
              {privacyTab === 'data' ? (
                <>
                  {/* Share Location */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Share Location with Emergency Contacts</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: '1.5' }}>Automatically share your real-time GPS coordinates with your selected trusted contacts during active trips.</div>
                    </div>
                    <button
                      onClick={() => handleTogglePrivacy('shareLocation')}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: privacySettings.shareLocation ? '#2563EB' : '#CBD5E1',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        padding: 0,
                        flexShrink: 0,
                        marginTop: '4px'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: privacySettings.shareLocation ? '23px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }} />
                    </button>
                  </div>

                  {/* Personalized Ads */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Personalized Ads & Promotions</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: '1.5' }}>Allow Ridevel to analyze your ride frequency and popular destinations to provide custom partner discounts and relevant ads.</div>
                    </div>
                    <button
                      onClick={() => handleTogglePrivacy('personalizedAds')}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: privacySettings.personalizedAds ? '#2563EB' : '#CBD5E1',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        padding: 0,
                        flexShrink: 0,
                        marginTop: '4px'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: privacySettings.personalizedAds ? '23px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }} />
                    </button>
                  </div>

                  {/* Third Party Data Sharing */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Share Aggregated Route Data</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: '1.5' }}>Share anonymized and aggregated route details with municipal transport agencies to help improve public roads and reduce city traffic.</div>
                    </div>
                    <button
                      onClick={() => handleTogglePrivacy('thirdPartySharing')}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: privacySettings.thirdPartySharing ? '#2563EB' : '#CBD5E1',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        padding: 0,
                        flexShrink: 0,
                        marginTop: '4px'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: privacySettings.thirdPartySharing ? '23px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Two Factor Authentication */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Two-Factor Login Authentication (2FA)</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: '1.5' }}>Request a one-time verification passcode via email or SMS when signing in from unrecognized web browsers or mobile devices.</div>
                    </div>
                    <button
                      onClick={() => handleTogglePrivacy('twoFactorAuth')}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: privacySettings.twoFactorAuth ? '#2563EB' : '#CBD5E1',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        padding: 0,
                        flexShrink: 0,
                        marginTop: '4px'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: privacySettings.twoFactorAuth ? '23px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }} />
                    </button>
                  </div>

                  {/* Incognito Search */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Incognito Mode (Hide Search History)</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: '1.5' }}>Do not save address searches, pickup/drop coordinates, or location inputs to the recent search queries list on this device.</div>
                    </div>
                    <button
                      onClick={() => handleTogglePrivacy('incognito')}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: privacySettings.incognito ? '#2563EB' : '#CBD5E1',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        padding: 0,
                        flexShrink: 0,
                        marginTop: '4px'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: privacySettings.incognito ? '23px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }} />
                    </button>
                  </div>

                  {/* Marketing Communications */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Marketing Emails & SMS Notifications</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: '1.5' }}>Opt in to receive marketing newsletters, product announcements, discount offers, and customer satisfaction surveys.</div>
                    </div>
                    <button
                      onClick={() => handleTogglePrivacy('marketingEmails')}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: privacySettings.marketingEmails ? '#2563EB' : '#CBD5E1',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        padding: 0,
                        flexShrink: 0,
                        marginTop: '4px'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: privacySettings.marketingEmails ? '23px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }} />
                    </button>
                  </div>

                  {/* Account Deletion */}
                  <div style={{ border: '1px dashed #FCA5A5', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#FFF5F5', marginTop: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#EF4444' }}>Danger Zone: Delete Account</div>
                      <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '4px', lineHeight: '1.5' }}>Permanently erase your Ridevel user profile, ride analytics, invoices, and active wallet balances. This action is irreversible.</div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Are you absolutely sure you want to request permanent account deletion? This will deactivate your profile immediately.")) {
                          alert("A verification link and deletion confirmation code have been sent to your registered email address.");
                        }
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '10px 16px',
                        background: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#B91C1C'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#DC2626'}
                    >
                      Request Account Deletion
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Button */}
            <button
              onClick={() => setShowManageAccountModal(false)}
              style={{ width: '100%', padding: '14px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '24px', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Save & Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Legal Modal */}
      {showLegalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: isMobile ? '20px' : '32px', width: '600px', maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' }}>Legal Information</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>Review Ridevel terms, privacy agreements, and licenses</p>
              </div>
              <button 
                onClick={() => setShowLegalModal(false)} 
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer', color: '#64748B', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E2E8F0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F1F5F9'}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '4px', textAlign: 'left' }}>
              {/* Section 1: Privacy Policy */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>1. Data Privacy Policy</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                  Ridevel is committed to safeguarding customer data. We collect location data only to track active trips, match riders with drivers, and calculate fares. Your details are encrypted end-to-end and stored securely. We do not sell user data to advertising firms.
                </p>
              </div>

              {/* Section 2: Terms of Service */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>2. Terms & Conditions</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                  By booking a ride through Ridevel, you agree to treat the driver with respect, cooperate with safety standards, and pay the calculated fare. Cancellation charges may apply if a trip is cancelled more than 5 minutes after acceptance by the driver.
                </p>
              </div>

              {/* Section 3: Community Guidelines */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>3. Community Guidelines</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                  Our platform works on trust and mutual safety. Discriminatory behavior, violence, or damage to driver property will lead to immediate, permanent deactivation of your Ridevel account and legal reporting to law enforcement authorities.
                </p>
              </div>

              {/* Section 4: Cookie Policy */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>4. Cookie Usage Policy</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                  We use browser cookies to securely save your authentication tokens, store recent address searches locally, and save user theme/city configurations to deliver a smooth user experience.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowLegalModal(false)}
              style={{ width: '100%', padding: '14px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '24px' }}
            >
              I Understand & Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: isMobile ? '20px' : '32px', width: '560px', maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' }}>Help & Support Center</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>Get quick answers, safety guidance, and submit tickets</p>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)} 
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer', color: '#64748B', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E2E8F0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F1F5F9'}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px', textAlign: 'left' }}>
              
              {/* Emergency Assistance Button */}
              <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#EF4444' }}>🚨 Emergency Safety Hotline</div>
                  <div style={{ fontSize: '11px', color: '#991B1B', marginTop: '2px' }}>Are you in immediate danger or have a roadside emergency?</div>
                </div>
                <button
                  onClick={() => alert("Simulating call to emergency support helpline (112 / Ridevel Emergency Response System). Support agents notified.")}
                  style={{ padding: '8px 16px', background: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Alert Support
                </button>
              </div>

              {/* FAQs */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>Frequently Asked Questions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Q: How do I report a lost item in a cab?</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: 1.5 }}>A: Go to your Activity history, click on the trip, and select "Report Lost Item". We will immediately contact the driver.</div>
                  </div>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Q: How are ride cancellation fees calculated?</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: 1.5 }}>A: Fares cancelled within 5 minutes are free. After that, a flat ₹50 fee applies to compensate driver fuel and time.</div>
                  </div>
                </div>
              </div>

              {/* Support Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>Write to our support team</h4>
                <textarea
                  placeholder="Describe your issue or query (e.g. fare billing, driver feedback, app issues)..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', color: '#0F172A', fontSize: '13px', resize: 'none', outline: 'none' }}
                />
                <button
                  onClick={(e) => {
                    const area = e.currentTarget.previousElementSibling;
                    if (area && area.value.trim() !== '') {
                      alert("Your support request has been logged successfully. Ticket ID: RDV-" + Math.floor(100000 + Math.random() * 900000));
                      area.value = '';
                    } else {
                      alert("Please type a message first.");
                    }
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '10px 20px',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Send Support Request
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              style={{ width: '100%', padding: '14px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '20px' }}
            >
              Close Support
            </button>
          </div>
        </div>
      )}

      {/* Branded "R" Loading Screen */}
      {loading && <BrandedLoader text="Connecting you to nearest Ridevel driver..." />}
    </div>
  );
};

