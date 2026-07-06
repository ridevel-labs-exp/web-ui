import React, { useEffect, useState } from 'react';
import { driverService } from '../services/driverService';
import { tripService } from '../services/tripService';
import { authService } from '../services/authService';
import CabMap from '../components/CabMap';
import { Check, X, ShieldAlert, List, Clock, Eye, Calendar, Filter, UserCheck, MapPin, Search } from 'lucide-react';

export default function AdminDashboard() {
  const [activeMainTab, setActiveMainTab] = useState('bookings'); // 'bookings' or 'drivers'
  const [bookingSubTab, setBookingSubTab] = useState('NOW'); // 'NOW' or 'LATER'
  
  // Bookings state
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL', 'DAILY', 'MONTHLY'
  const [selectedDriverForAssign, setSelectedDriverForAssign] = useState({});

  // Drivers state
  const [drivers, setDrivers] = useState([]);
  const [driverSearch, setDriverSearch] = useState('');
  const [driversLoading, setDriversLoading] = useState(true);
  const [selectedDriverModal, setSelectedDriverModal] = useState(null);

  // Audit timeline state
  const [selectedTripId, setSelectedTripId] = useState('');
  const [tripHistory, setTripHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchDrivers = async () => {
    try {
      const data = await driverService.getAllDrivers();
      setDrivers(data);
    } catch (err) {
      console.error('Failed to fetch driver list', err);
    } finally {
      setDriversLoading(false);
    }
  };

  const fetchTrips = async () => {
    setTripsLoading(true);
    try {
      const data = await tripService.getAllTrips();
      setTrips(data || []);
    } catch (err) {
      console.error('Failed to fetch trips', err);
      setTrips([]);
    } finally {
      setTripsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchTrips();
  }, []);

  const handleReviewDriver = async (driverId, status) => {
    try {
      await driverService.reviewOnboarding(driverId, status);
      fetchDrivers();
      setSelectedDriverModal(null);
    } catch (err) {
      console.error('Onboarding review action failed', err);
    }
  };

  const handleAssignDriverToTrip = async (tripId) => {
    const driverId = selectedDriverForAssign[tripId];
    if (!driverId) return;
    try {
      await tripService.updateTripStatus(tripId, 'ACCEPTED');
      alert(`Trip #${tripId.substring(0, 8)} assigned to driver!`);
      fetchTrips();
    } catch (err) {
      alert('Failed to assign driver.');
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

  // Filtered drivers
  const filteredDrivers = drivers.filter(d => 
    d.licenseNumber?.toLowerCase().includes(driverSearch.toLowerCase()) ||
    d.rcNumber?.toLowerCase().includes(driverSearch.toLowerCase())
  );

  // Filtered trips (50 per page pagination)
  const filteredTrips = trips.filter(t => {
    const isLater = t.isScheduled || t.scheduledDateTime;
    if (bookingSubTab === 'NOW' && isLater) return false;
    if (bookingSubTab === 'LATER' && !isLater) return false;

    if (dateFilter === 'DAILY') {
      const today = new Date().toISOString().split('T')[0];
      const tripDate = new Date(t.createdAt || Date.now()).toISOString().split('T')[0];
      return today === tripDate;
    }
    if (dateFilter === 'MONTHLY') {
      const thisMonth = new Date().toISOString().substring(0, 7);
      const tripMonth = new Date(t.createdAt || Date.now()).toISOString().substring(0, 7);
      return thisMonth === tripMonth;
    }
    return true;
  });

  const pageSize = 50;
  const totalPages = Math.ceil(filteredTrips.length / pageSize) || 1;
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const verifiedDrivers = drivers.filter(d => d.onboardingStatus === 'APPROVED');

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Clean Header Bar */}
      <header style={{ height: '70px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' }}>Ridevel <span style={{ fontSize: '13px', background: '#1E293B', color: '#FFFFFF', padding: '3px 10px', borderRadius: '12px', fontWeight: '800' }}>ADMIN</span></div>
          
          <nav style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveMainTab('bookings')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: activeMainTab === 'bookings' ? '#2563EB' : 'transparent',
                color: activeMainTab === 'bookings' ? '#FFFFFF' : '#64748B',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <List size={16} /> Bookings Overview
            </button>

            <button
              onClick={() => setActiveMainTab('drivers')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: activeMainTab === 'drivers' ? '#2563EB' : 'transparent',
                color: activeMainTab === 'drivers' ? '#FFFFFF' : '#64748B',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UserCheck size={16} /> Driver Management
            </button>
          </nav>
        </div>

        <button onClick={authService.logout} style={{ background: '#F1F5F9', border: 'none', color: '#64748B', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px' }}>
        
        {/* 1. BOOKINGS OVERVIEW TAB */}
        {activeMainTab === 'bookings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Ride Bookings Control Panel</h1>
                <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: '14px' }}>Manage Pick-Up Now and Pick-Up Later requests & assign verified drivers</p>
              </div>

              {/* Date Filters */}
              <div style={{ display: 'flex', gap: '8px', background: '#FFFFFF', padding: '4px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                <button onClick={() => setDateFilter('ALL')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: dateFilter === 'ALL' ? '#1E293B' : 'transparent', color: dateFilter === 'ALL' ? '#FFFFFF' : '#64748B', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>All Dates</button>
                <button onClick={() => setDateFilter('DAILY')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: dateFilter === 'DAILY' ? '#1E293B' : 'transparent', color: dateFilter === 'DAILY' ? '#FFFFFF' : '#64748B', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Today Only</button>
                <button onClick={() => setDateFilter('MONTHLY')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: dateFilter === 'MONTHLY' ? '#1E293B' : 'transparent', color: dateFilter === 'MONTHLY' ? '#FFFFFF' : '#64748B', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>This Month</button>
              </div>
            </div>

            {/* Horizontal Sub-Tabs: Pick-Up Now vs Pick-Up Later */}
            <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: '24px', gap: '24px' }}>
              <button
                onClick={() => { setBookingSubTab('NOW'); setCurrentPage(1); }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: bookingSubTab === 'NOW' ? '3px solid #2563EB' : '3px solid transparent',
                  color: bookingSubTab === 'NOW' ? '#2563EB' : '#64748B',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563EB' }} />
                Pick-Up Now Requests
              </button>

              <button
                onClick={() => { setBookingSubTab('LATER'); setCurrentPage(1); }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: bookingSubTab === 'LATER' ? '3px solid #D97706' : '3px solid transparent',
                  color: bookingSubTab === 'LATER' ? '#D97706' : '#64748B',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706' }} />
                Pick-Up Later Requests (Scheduled)
              </button>
            </div>

            {/* Trips List Table / Cards with Uber-style Map Previews */}
            {tripsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading bookings...</div>
            ) : paginatedTrips.length === 0 ? (
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '40px', textAlign: 'center', color: '#64748B' }}>
                No {bookingSubTab === 'NOW' ? 'Pick-Up Now' : 'Pick-Up Later'} bookings found for the selected filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {paginatedTrips.map(trip => (
                  <div key={trip.id} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '24px', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    
                    {/* Embedded Mini Map Preview */}
                    <div style={{ height: '160px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                      <CabMap
                        pickup={{ lat: trip.pickupLat || 12.9716, lng: trip.pickupLng || 77.5946, address: trip.pickupAddress }}
                        drop={{ lat: trip.dropLat || 12.9850, lng: trip.dropLng || 77.6100, address: trip.dropAddress }}
                      />
                    </div>

                    {/* Trip Info Details */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', color: '#475569' }}>
                          TRIP #{trip.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '700', background: bookingSubTab === 'NOW' ? '#EFF6FF' : '#FEF3C7', color: bookingSubTab === 'NOW' ? '#2563EB' : '#D97706', padding: '3px 8px', borderRadius: '12px' }}>
                          {bookingSubTab === 'NOW' ? 'PICK-UP NOW' : 'PICK-UP LATER'}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', marginLeft: 'auto' }}>
                          ₹{trip.fare}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#0F172A', display: 'flex', flexDirection: 'column', gap: '6px', margin: '12px 0' }}>
                        <div>🟢 <strong>Pickup:</strong> {trip.pickupAddress}</div>
                        <div>🔴 <strong>Drop:</strong> {trip.dropAddress}</div>
                      </div>

                      {trip.scheduledDateTime && (
                        <div style={{ fontSize: '12px', color: '#D97706', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={14} /> Scheduled For: {trip.scheduledDateTime}
                        </div>
                      )}
                    </div>

                    {/* Driver Assignment & Admin Action Controls */}
                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>DRIVER ASSIGNMENT</div>
                      
                      {trip.driverId ? (
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <UserCheck size={16} /> Driver Assigned
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <select
                            value={selectedDriverForAssign[trip.id] || ''}
                            onChange={(e) => setSelectedDriverForAssign({ ...selectedDriverForAssign, [trip.id]: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', color: '#0F172A' }}
                          >
                            <option value="">Select Verified Driver...</option>
                            {verifiedDrivers.map(drv => (
                              <option key={drv.id} value={drv.id}>
                                {drv.licenseNumber} (RC: {drv.rcNumber})
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleAssignDriverToTrip(trip.id)}
                            disabled={!selectedDriverForAssign[trip.id]}
                            style={{ padding: '8px 12px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', opacity: !selectedDriverForAssign[trip.id] ? 0.5 : 1 }}
                          >
                            Assign Selected Driver
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* 50 Trips Per Page Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: currentPage === page ? '#2563EB' : '#FFFFFF',
                      color: currentPage === page ? '#FFFFFF' : '#0F172A',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. DRIVERS MANAGEMENT TAB */}
        {activeMainTab === 'drivers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Driver Profiles & Documents</h1>
                <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: '14px' }}>Search and review driver onboarding licenses and uploaded vehicle documents</p>
              </div>

              {/* Search Driver Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 14px', width: '320px' }}>
                <Search size={16} style={{ color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Search License or RC..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#0F172A', width: '100%' }}
                />
              </div>
            </div>

            {driversLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading drivers...</div>
            ) : filteredDrivers.length === 0 ? (
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748B', border: '1px solid #E2E8F0' }}>No drivers match your search query.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {filteredDrivers.map(drv => (
                  <div key={drv.id} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>License: {drv.licenseNumber}</span>
                      <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', background: drv.onboardingStatus === 'APPROVED' ? '#ECFDF5' : '#FEF3C7', color: drv.onboardingStatus === 'APPROVED' ? '#10B981' : '#D97706' }}>
                        {drv.onboardingStatus}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                      <div>RC Number: <strong>{drv.rcNumber}</strong></div>
                      <div>Insurance Policy: <strong>{drv.insurancePolicy}</strong></div>
                    </div>

                    <button
                      onClick={() => setSelectedDriverModal(drv)}
                      style={{ width: '100%', padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#2563EB', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Eye size={16} /> Inspect Documents
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Driver Document Modal */}
      {selectedDriverModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '32px', width: '680px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Driver Document Verification</h3>
              <X size={20} onClick={() => setSelectedDriverModal(null)} style={{ cursor: 'pointer', color: '#64748B' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textAlign: 'center', marginBottom: '4px' }}>Front Photo</div>
                <img src={driverService.getFileUrl(selectedDriverModal.photoFrontUrl)} alt="Front" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textAlign: 'center', marginBottom: '4px' }}>Side Photo</div>
                <img src={driverService.getFileUrl(selectedDriverModal.photoSideUrl)} alt="Side" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textAlign: 'center', marginBottom: '4px' }}>Back Photo</div>
                <img src={driverService.getFileUrl(selectedDriverModal.photoBackUrl)} alt="Back" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            {selectedDriverModal.onboardingStatus === 'PENDING' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button onClick={() => handleReviewDriver(selectedDriverModal.id, 'APPROVED')} style={{ padding: '12px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  Approve Application
                </button>
                <button onClick={() => handleReviewDriver(selectedDriverModal.id, 'REJECTED')} style={{ padding: '12px', background: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  Reject Application
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
