import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
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
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
      <div style="position: absolute; width: 36px; height: 36px; background: rgba(0, 0, 0, 0.15); border-radius: 50%; animation: pulse-ring 2s infinite;"></div>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" style="position: relative; z-index: 2; filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.5));">
        <path d="M12 3l9 16H3L12 3z"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const dropIcon = L.divIcon({
  className: 'custom-drop-pin',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
      <div style="position: absolute; width: 36px; height: 36px; background: rgba(0, 0, 0, 0.15); border-radius: 50%; animation: pulse-ring 2s infinite;"></div>
      <div style="position: relative; background: #000000; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 2;">
        <div style="background: #ffffff; width: 6px; height: 6px; border-radius: 50%;"></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
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

// Helper component to handle map clicks for manual pin placement
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

// Helper component to auto-recenter and fit bounds of the map
function RecenterMap({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, bounds, map]);
  return null;
}

export default function CabMap({ pickup, drop, driver, onMapClick, onReroutingAlert }) {
  // Default map center set to Bangalore
  const defaultCenter = [12.9716, 77.5946];
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [driverRouteCoordinates, setDriverRouteCoordinates] = useState([]);

  const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (driver && pickup && drop && routeCoordinates.length > 0 && onReroutingAlert) {
      let minD = Infinity;
      for (let i = 0; i < routeCoordinates.length; i++) {
        const pt = routeCoordinates[i];
        const dist = calculateHaversineKm(driver.lat, driver.lng, pt[0], pt[1]);
        if (dist < minD) {
          minD = dist;
        }
      }
      // Trigger rerouting alert if driver is more than 300 meters (0.3 km) from route path
      if (minD > 0.3) {
        onReroutingAlert(true);
      } else {
        onReroutingAlert(false);
      }
    } else if (onReroutingAlert) {
      onReroutingAlert(false);
    }
  }, [driver, pickup, drop, routeCoordinates, onReroutingAlert]);

  useEffect(() => {
    // Inject the pulse-ring animation style dynamically if not already present
    const styleId = 'pulse-ring-animation-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes pulse-ring {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

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

  // Fetch actual route from OSRM for pickup to dropoff
  useEffect(() => {
    if (pickup && drop) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRouteCoordinates(coords);
          } else {
            setRouteCoordinates([[pickup.lat, pickup.lng], [drop.lat, drop.lng]]);
          }
        })
        .catch(err => {
          console.error('Failed to fetch OSRM route:', err);
          setRouteCoordinates([[pickup.lat, pickup.lng], [drop.lat, drop.lng]]);
        });
    } else {
      setRouteCoordinates([]);
    }
  }, [pickup, drop]);

  // Fetch actual route from OSRM for driver to pickup
  useEffect(() => {
    if (driver && pickup && !drop) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${driver.lng},${driver.lat};${pickup.lng},${pickup.lat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setDriverRouteCoordinates(coords);
          } else {
            setDriverRouteCoordinates([[driver.lat, driver.lng], [pickup.lat, pickup.lng]]);
          }
        })
        .catch(err => {
          console.error('Failed to fetch driver OSRM route:', err);
          setDriverRouteCoordinates([[driver.lat, driver.lng], [pickup.lat, pickup.lng]]);
        });
    } else {
      setDriverRouteCoordinates([]);
    }
  }, [driver, pickup, drop]);

  const hasRoute = pickup && drop;
  const bounds = hasRoute ? [
    [pickup.lat, pickup.lng],
    [drop.lat, drop.lng]
  ] : (driver && pickup ? [
    [driver.lat, driver.lng],
    [pickup.lat, pickup.lng]
  ] : null);

  return (
    <div className="map-container" style={{ height: '100%', borderRadius: 'inherit', border: 'none', boxShadow: 'none' }}>
      <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true}>
        {/* Voyager tiles with clean color scheme (white roads/land, blue water, green parks) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler onMapClick={onMapClick} />
        <RecenterMap center={mapCenter} bounds={bounds} />

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
        {driver && pickup && !drop && driverRouteCoordinates.length > 0 && (
          <Polyline
            positions={driverRouteCoordinates}
            color="#334155"
            weight={5}
            opacity={0.8}
            dashArray="8, 8"
          />
        )}

        {/* Route Line 2: Pickup to Drop-off (Trip in Progress) */}
        {hasRoute && routeCoordinates.length > 0 && (
          <>
            {/* Background shadow/border line */}
            <Polyline
              positions={routeCoordinates}
              color="#000000"
              weight={8}
              opacity={0.15}
            />
            {/* Foreground active route line */}
            <Polyline
              positions={routeCoordinates}
              color="#000000"
              weight={5}
              opacity={0.9}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
