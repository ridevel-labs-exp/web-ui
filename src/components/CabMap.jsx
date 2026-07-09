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
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 56px; height: 44px;">
      <div style="position: absolute; width: 56px; height: 56px; background: rgba(37, 99, 235, 0.2); border-radius: 50%; animation: pulse-ring 2s infinite;"></div>
      <div style="position: relative; z-index: 10; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));">
        <svg viewBox="0 0 100 60" width="56" height="38" style="display: block;">
          <!-- Underbody Shadow -->
          <ellipse cx="48" cy="50" rx="42" ry="6" fill="#0F172A" opacity="0.5" />
          
          <!-- Wheels -->
          <!-- Rear wheel -->
          <ellipse cx="25" cy="43" rx="8" ry="7.5" fill="#1E293B" />
          <ellipse cx="25" cy="43" rx="3.5" ry="3" fill="#E2E8F0" />
          <!-- Front wheel -->
          <ellipse cx="69" cy="46" rx="8" ry="7.5" fill="#1E293B" />
          <ellipse cx="69" cy="46" rx="3.5" ry="3" fill="#E2E8F0" />
          
          <!-- Main White Body -->
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
                fill="#FFFFFF" 
                stroke="#CBD5E1" 
                stroke-width="1" />
                
          <!-- Black Panoramic Glass Roof & Canopy -->
          <path d="M 28,15 
                   C 28,15 36,9 50,8 
                   C 64,7 74,13 74,13 
                   L 62,24 
                   C 62,24 55,27 45,26 
                   C 35,25 24,19 24,19 Z" 
                fill="#0F172A" />
                
          <!-- Side Windows & Windshield -->
          <path d="M 24,19 
                   L 30,16 
                   C 30,16 38,12 48,12 
                   L 58,16 
                   L 60,20 
                   C 60,20 54,23 46,22 
                   C 38,21 24,19 24,19 Z" 
                fill="#1E293B" 
                opacity="0.9" />
                
          <!-- Side Mirror -->
          <ellipse cx="62" cy="20" rx="3" ry="2" fill="#0F172A" />
          <ellipse cx="28" cy="18" rx="2" ry="1.5" fill="#0F172A" />
          
          <!-- Headlight glow -->
          <path d="M 91,38 C 93,39 95,40 95,41 C 94,41 92,41 90,40 Z" fill="#FBBF24" />
        </svg>
      </div>
    </div>
  `,
  iconSize: [56, 44],
  iconAnchor: [28, 22],
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
