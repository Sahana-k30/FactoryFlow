import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { Truck, MapPin, Clock, Gauge, Activity, Navigation, Box } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const sourceIcon = createIcon('green');
const destIcon = createIcon('red');
const truckIcon = createIcon('blue');

// Distance calculation (km)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const MapBoundsFitter = ({ routePath }) => {
  const map = useMap();
  useEffect(() => {
    if (routePath && routePath.length > 0) {
      map.fitBounds(routePath, { padding: [50, 50] });
    }
  }, [routePath, map]);
  return null;
};

const LiveTracking = () => {
  const { state } = useLocation();
  const shipmentToTrack = state?.shipment;

  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeDestination, setRouteDestination] = useState(null);

  useEffect(() => {
    if (!shipmentToTrack) return;
    
    const geocode = async (locationStr) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&format=json&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (err) {
        console.error("Geocoding failed for", locationStr, err);
      }
      return null;
    };

    const resolveLocations = async () => {
      const originCoords = await geocode(shipmentToTrack.origin);
      const destCoords = await geocode(shipmentToTrack.destination);
      
      // Fallbacks in case geocoding fails
      setRouteOrigin(originCoords || [34.0522, -118.2437]);
      setRouteDestination(destCoords || [33.8121, -117.9190]);
    };

    resolveLocations();
  }, [shipmentToTrack]);

  const [routePath, setRoutePath] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  
  // Tracking State
  const [currentPointIdx, setCurrentPointIdx] = useState(0);
  const [currentLocation, setCurrentLocation] = useState([34.0522, -118.2437]);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [progress, setProgress] = useState(0);

  const { userInfo } = useSelector((state) => state.auth);
  const hasArrived = useRef(false);

  // General Vehicles fallback
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    if (routeOrigin && routeDestination) {
      const fetchRoute = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${routeOrigin[1]},${routeOrigin[0]};${routeDestination[1]},${routeDestination[0]}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
             const path = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
             setRoutePath(path);
          }
        } catch (err) {
          console.error("OSRM error:", err);
        }
      };
      fetchRoute();
    }
  }, [routeOrigin, routeDestination]);

  // Deterministic Time-Based Simulation
  useEffect(() => {
    if (routePath.length === 0 || !shipmentToTrack) return;

    // Precompute cumulative distances for accurate traversal
    const cumDist = [0];
    for (let i = 1; i < routePath.length; i++) {
      cumDist.push(cumDist[i-1] + getDistance(routePath[i-1][0], routePath[i-1][1], routePath[i][0], routePath[i][1]));
    }
    const totalDist = cumDist[cumDist.length - 1];
    setTotalDistance(totalDist);

    const startTime = new Date(shipmentToTrack.updatedAt || Date.now()).getTime();
    
    // Set to a realistic trucking speed of 65 km/h
    const speedKmh = 65; 
    const speedKms = speedKmh / 3600;

    const socket = io(import.meta.env.VITE_SOCKET_URL);

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - startTime) / 1000;
      
      let distCovered = elapsedSec * speedKms;

      // Handle arrival
      if (distCovered >= totalDist) {
        distCovered = totalDist;
        if (!hasArrived.current) {
          hasArrived.current = true;
          // Trigger delivery API update
          fetch(`${import.meta.env.VITE_API_URL}/shipments/${shipmentToTrack._id}/status`, {
             method: 'PUT',
             headers: { 
               'Content-Type': 'application/json',
               Authorization: `Bearer ${userInfo?.token}`
             },
             body: JSON.stringify({ status: 'Delivered' })
          }).catch(err => console.error(err));
        }
      }

      let idx = 0;
      while (idx < cumDist.length - 1 && cumDist[idx + 1] <= distCovered) {
        idx++;
      }
      
      setCurrentPointIdx(idx);
      setCurrentLocation(routePath[idx]); 
      
      const remaining = Math.max(0, totalDist - distCovered);
      setDistanceRemaining(remaining);
      setSpeed(distCovered >= totalDist ? 0 : (speedKmh + (Math.random() * 5 - 2.5))); 
      setProgress(Math.max(0, Math.min(100, (distCovered / totalDist) * 100)));

    }, 1000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [routePath, shipmentToTrack, userInfo?.token]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
            <Navigation className="text-accent" /> Live Tracking Intelligence
          </h2>
          {shipmentToTrack && (
            <p className="text-emerald-400 font-medium mt-1">
              Active Session: {shipmentToTrack.shipmentId}
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-slate-300 text-sm font-semibold">Live Sync Active</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-[600px]">
        {/* Left: Map Area (70%) */}
        <div className="flex-[3] glass-card overflow-hidden rounded-xl border border-slate-700/50 relative z-0 shadow-2xl shadow-blue-900/20">
          <MapContainer center={currentLocation} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            <MapBoundsFitter routePath={routePath} />

            {/* Faded Remaining Route */}
            {routePath.length > 0 && (
               <Polyline positions={routePath} color="#475569" weight={4} dashArray="5, 10" opacity={0.6} />
            )}

            {/* Completed Route (Solid Blue) */}
            {routePath.length > 0 && currentPointIdx > 0 && (
               <Polyline positions={routePath.slice(0, currentPointIdx + 1)} color="#3b82f6" weight={5} />
            )}

            {/* Source Marker */}
            {routeOrigin && (
              <Marker position={routeOrigin} icon={sourceIcon}>
                <Popup className="custom-popup"><h4 className="font-bold text-black">Source: {shipmentToTrack?.origin}</h4></Popup>
              </Marker>
            )}

            {/* Destination Marker */}
            {routeDestination && (
              <Marker position={routeDestination} icon={destIcon}>
                <Popup className="custom-popup"><h4 className="font-bold text-black">Destination: {shipmentToTrack?.destination}</h4></Popup>
              </Marker>
            )}

            {/* Vehicle Marker */}
            {routePath.length > 0 && (
              <Marker position={currentLocation} icon={truckIcon}>
                <Popup className="custom-popup">
                  <div className="p-1">
                    <h4 className="font-bold text-black">{shipmentToTrack?.assignedVehicleId?.registration || 'TRK-1001'}</h4>
                    <p className="text-xs text-gray-600">Speed: {speed.toFixed(0)} km/h</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Right: Sidebar Metrics (30%) */}
        <div className="flex-[1] flex flex-col gap-4">
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-50"></div>
            <Truck size={48} className={`text-accent mb-3 ${speed > 0 ? 'animate-bounce' : ''}`} />
            <h3 className="text-2xl font-bold text-white mb-1">
              {shipmentToTrack?.assignedVehicleId?.registration || 'Awaiting Assign'}
            </h3>
            <p className="text-slate-400 text-sm">{shipmentToTrack?.assignedVehicleId?.type || 'Heavy Truck'}</p>
            <span className="mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {progress >= 100 ? 'Arrived' : speed > 0 ? 'In Transit' : 'Idle'}
            </span>
          </div>

          <div className="glass-card p-6 flex-1 flex flex-col gap-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-2">Logistics Telemetry</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="p-2 bg-slate-800 rounded-lg"><Gauge size={18} className="text-purple-400" /></div>
                  <span className="font-medium">Current Speed</span>
                </div>
                <span className="text-xl font-bold text-white">{speed.toFixed(0)} <span className="text-sm text-slate-500">km/h</span></span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="p-2 bg-slate-800 rounded-lg"><MapPin size={18} className="text-red-400" /></div>
                  <span className="font-medium">Distance Left</span>
                </div>
                <span className="text-xl font-bold text-white">{distanceRemaining.toFixed(1)} <span className="text-sm text-slate-500">km</span></span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="p-2 bg-slate-800 rounded-lg"><Clock size={18} className="text-yellow-400" /></div>
                  <span className="font-medium">Est. Arrival</span>
                </div>
                <span className="text-xl font-bold text-white">
                  {speed > 0 ? ((distanceRemaining / speed) * 60).toFixed(0) : '--'} <span className="text-sm text-slate-500">min</span>
                </span>
              </div>
            </div>

            <div className="mt-auto">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-400">Route Progress</span>
                <span className="text-accent">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-700/50">
                <div className="h-full bg-gradient-to-r from-blue-500 to-accent rounded-full relative" style={{ width: `${progress}%`, transition: 'width 1s linear' }}>
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:1rem_1rem] animate-[shimmer_1s_linear_infinite]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
