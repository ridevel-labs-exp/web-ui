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

// Custom Premium Map Pins using L.divIcon
const createHtmlIcon = (color, shadowColor) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color};
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 12px ${shadowColor};
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const pickupIcon = createHtmlIcon('#10b981', 'rgba(16, 185, 129, 0.6)'); // Green
const dropIcon = createHtmlIcon('#ef4444', 'rgba(239, 68, 68, 0.6)');   // Red
const driverIcon = createHtmlIcon('#ffcc00', 'rgba(255, 204, 0, 0.8)'); // Yellow (Driver)

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
    <div className="map-container">
      <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true}>
        {/* Sleek Dark CartoDB Map Tiles to match our dark premium theme */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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

        {/* Route Line */}
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
