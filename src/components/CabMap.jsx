import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Leaflet default icon fix to prevent missing asset errors
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Modern Premium Map Pins
const pickupIcon = L.divIcon({
  className: 'custom-pickup-pin',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 40px; height: 40px; background: rgba(16, 185, 129, 0.35); border-radius: 50%; animation: pulse-ring 2s infinite;"></div>
      <div style="background: #10b981; color: #ffffff; width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6); display: flex; align-items: center; justify-content: center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const dropIcon = L.divIcon({
  className: 'custom-drop-pin',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 40px; height: 40px; background: rgba(239, 68, 68, 0.35); border-radius: 50%;"></div>
      <div style="background: #ef4444; color: #ffffff; width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.6); display: flex; align-items: center; justify-content: center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" x2="4" y1="22" y2="15"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Dezire Sedan Car Icon with glowing aura for Driver
const driverIcon = L.divIcon({
  className: 'custom-driver-pin',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 46px; height: 46px; background: rgba(255, 204, 0, 0.3); border-radius: 50%; animation: pulse-ring 2s infinite;"></div>
      <div style="background: #ffcc00; width: 34px; height: 34px; border-radius: 50%; border: 2px solid #000000; box-shadow: 0 4px 16px rgba(255, 204, 0, 0.8); display: flex; align-items: center; justify-content: center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.7 0-1.3.3-1.8.7C4.3 8.6 3 10 3 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [46, 46],
  iconAnchor: [23, 23],
});

// Helper component to auto-recenter the map when coordinates change
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function CabMap({ pickup, drop, driver }) {
  // Default map center set to Bangalore (where PostGIS queries can run)
  const defaultCenter = [12.9716, 77.5946];
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  useEffect(() => {
    // Automatically detect user's live browser GPS location on startup
    if (navigator.geolocation && !pickup && !driver) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setMapCenter([userLat, userLng]);
          console.log(`>>> Detected user live GPS location: [${userLat}, ${userLng}]`);
        },
        (err) => {
          console.warn('Browser geolocation denied or unavailable. Using default location.', err);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (pickup) {
      setMapCenter([pickup.lat, pickup.lng]);
    } else if (driver) {
      setMapCenter([driver.lat, driver.lng]);
    }
  }, [pickup, driver]);

  const hasRoute = pickup && drop;

  return (
    <div className="map-container" style={{ height: '100%', borderRadius: 'inherit', border: 'none', boxShadow: 'none' }}>
      <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true}>
        {/* Sleek Light CartoDB Map Tiles to match our light theme */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <RecenterMap center={mapCenter} />

        {/* Pickup Pin */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div style={{ color: '#0f172a' }}><strong>Pickup Location</strong></div>
            </Popup>
          </Marker>
        )}

        {/* Drop-off Pin */}
        {drop && (
          <Marker position={[drop.lat, drop.lng]} icon={dropIcon}>
            <Popup>
              <div style={{ color: '#0f172a' }}><strong>Drop-off Destination</strong></div>
            </Popup>
          </Marker>
        )}

        {/* Live Driver Car Pin */}
        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>
              <div style={{ color: '#0f172a' }}>
                <strong>Driver Live Position</strong><br />
                {driver.isAvailable ? 'Available' : 'On Trip'}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Line 1: Driver to Pickup (Heading to Rider) */}
        {driver && pickup && !drop && (
          <Polyline
            positions={[
              [driver.lat, driver.lng],
              [pickup.lat, pickup.lng],
            ]}
            color="#ffcc00"
            weight={4}
            opacity={0.9}
            dashArray="8, 8"
          />
        )}

        {/* Route Line 2: Pickup to Drop-off (Trip in Progress) */}
        {hasRoute && (
          <Polyline
            positions={[
              [pickup.lat, pickup.lng],
              [drop.lat, drop.lng],
            ]}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
}
