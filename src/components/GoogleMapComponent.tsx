import { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Shield, Eye, Navigation, MapPin, Sparkles } from 'lucide-react';

interface ViteEnv {
  VITE_GOOGLE_MAPS_API_KEY?: string;
  VITE_GOOGLE_MAPS_PLATFORM_KEY?: string;
  [key: string]: string | undefined;
}

const API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as unknown as { env: ViteEnv }).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (import.meta as unknown as { env: ViteEnv }).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface LocationMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'gate' | 'transport' | 'parking' | 'accessibility';
  description: string;
}

const METLIFE_MARKERS: LocationMarker[] = [
  { id: 'm1', lat: 40.8145, lng: -74.0754, title: 'Gate A (North)', type: 'gate', description: 'Heavy congestion. Main entry path.' },
  { id: 'm2', lat: 40.8135, lng: -74.0724, title: 'Gate B (East)', type: 'gate', description: 'Moderate traffic. Fast processing.' },
  { id: 'm3', lat: 40.8115, lng: -74.0734, title: 'Lot G (Accessible)', type: 'accessibility', description: 'Wheelchair access ramp. Shuttle pickup.' },
  { id: 'm4', lat: 40.8155, lng: -74.0764, title: 'Rail Transit Station', type: 'transport', description: 'Meadowlands Rail Line terminal.' }
];

const SOFI_MARKERS: LocationMarker[] = [
  { id: 's1', lat: 33.9544, lng: -118.3410, title: 'Gate 1 (Main)', type: 'gate', description: 'Normal operations. Moderate queue.' },
  { id: 's2', lat: 33.9524, lng: -118.3370, title: 'Gate 3 (East)', type: 'gate', description: 'Smooth entry flow.' },
  { id: 's3', lat: 33.9504, lng: -118.3390, title: 'Lot C (Accessible)', type: 'accessibility', description: 'Premium accessible parking and elevators.' },
  { id: 's4', lat: 33.9554, lng: -118.3360, title: 'Bus Drop-off Zone', type: 'transport', description: 'Express shuttle connection terminal.' }
];

const AZTECA_MARKERS: LocationMarker[] = [
  { id: 'a1', lat: 19.3039, lng: -99.1515, title: 'Acceso 1', type: 'gate', description: 'High crowd density. Security bottleneck.' },
  { id: 'a2', lat: 19.3019, lng: -99.1495, title: 'Acceso 3', type: 'gate', description: 'Recommended alternative route.' },
  { id: 'a3', lat: 19.3009, lng: -99.1505, title: 'Accessible Ramp South', type: 'accessibility', description: 'High-visibility low-slope path.' },
  { id: 'a4', lat: 19.3049, lng: -99.1485, title: 'Metro Station Azteca', type: 'transport', description: 'Main rail transit node.' }
];

// Inner helper component to access map instance cleanly after provider binds
function PolylineRenderer({ 
  pathCoordinates, 
  routeType 
}: { 
  pathCoordinates?: { lat: number; lng: number }[]; 
  routeType?: string;
}) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !pathCoordinates || pathCoordinates.length === 0) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    // Clear old polyline if any
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Determine color of route based on selection type
    let strokeColor = '#3B82F6'; // Blue for standard
    if (routeType === 'crowd_avoidance') strokeColor = '#F59E0B'; // Amber
    if (routeType === 'accessible') strokeColor = '#10B981'; // Emerald Green
    if (routeType === 'family') strokeColor = '#EC4899'; // Pink
    if (routeType === 'evacuation') strokeColor = '#EF4444'; // Red

    const polyline = new google.maps.Polyline({
      path: pathCoordinates,
      geodesic: true,
      strokeColor,
      strokeOpacity: 0.85,
      strokeWeight: 6,
    });

    polyline.setMap(map);
    polylineRef.current = polyline;

    // Center map and scale viewport to capture the full path coordinates
    const bounds = new google.maps.LatLngBounds();
    pathCoordinates.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, pathCoordinates, routeType]);

  return null;
}

export default function GoogleMapComponent({
  lat,
  lng,
  stadiumId,
  pathCoordinates,
  routeType
}: {
  lat: number;
  lng: number;
  stadiumId: string;
  pathCoordinates?: { lat: number; lng: number }[];
  routeType?: string;
}) {
  const [selectedMarker, setSelectedMarker] = useState<LocationMarker | null>(null);
  const [showMockMap, setShowMockMap] = useState<boolean>(!hasValidKey);

  const getMarkers = () => {
    if (stadiumId === 'stadium-metlife') return METLIFE_MARKERS;
    if (stadiumId === 'stadium-sofi') return SOFI_MARKERS;
    return AZTECA_MARKERS;
  };

  const activeMarkers = getMarkers();

  // Color mapping based on marker types
  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'gate': return '#3B82F6'; // Blue
      case 'accessibility': return '#10B981'; // Green
      case 'transport': return '#F59E0B'; // Amber
      default: return '#EF4444'; // Red
    }
  };

  // 1. High fidelity SVG spatial fallback when no Google Maps key is specified
  if (showMockMap) {
    return (
      <div data-testid="google-map-default" className="relative w-full h-[400px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between p-4 font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
        
        {/* Mock Map Stadium Visualization */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 h-56 border-2 border-dashed border-sky-500/20 bg-sky-500/5 rounded-full flex items-center justify-center">
            <div className="w-52 h-40 border-4 border-slate-700 bg-slate-800/95 rounded-full shadow-2xl flex flex-col items-center justify-center relative">
              <span className="text-sky-400 text-xs font-semibold uppercase tracking-widest font-mono">FIFA FIELD</span>
              <div className="w-32 h-[2px] bg-sky-500/20 my-1"></div>
              <span className="text-slate-500 text-[10px] font-mono font-bold">SECURE ZONE</span>

              {/* Render simulated path overlays */}
              {pathCoordinates && pathCoordinates.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-full h-full absolute overflow-visible" viewBox="0 0 100 100">
                    <path
                      d="M 10,75 C 30,20 70,80 90,25"
                      fill="none"
                      stroke={routeType === 'crowd_avoidance' ? '#F59E0B' : routeType === 'accessible' ? '#10B981' : routeType === 'evacuation' ? '#EF4444' : '#3B82F6'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="6 3"
                      className="animate-pulse"
                    />
                  </svg>
                  <div className="absolute top-1 bg-slate-950 border border-sky-500/40 text-sky-400 text-[8px] font-mono px-1.5 py-0.5 rounded-full">
                    AI OPTIMAL TRAJECTORY ACTIVED
                  </div>
                </div>
              )}
            </div>
            
            {/* Displaying mock elements/routes */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
            <div className="absolute top-1/2 -left-6 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="absolute top-1/3 -right-6 w-3 h-3 bg-amber-500 rounded-full"></div>
          </div>
        </div>

        {/* Info Ribbon */}
        <div className="relative z-10 flex items-center justify-between bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-300 font-medium font-mono">FIFA Pulse Live Coordinates Mode</span>
          </div>
          <span className="text-slate-500 text-[10px] font-mono">LAT: {lat} / LNG: {lng}</span>
        </div>

        {/* Interactive Overlays on Fallback Map */}
        <div className="relative z-10 grid grid-cols-2 gap-2 max-w-sm mb-4">
          {activeMarkers.map(marker => (
            <button
              key={marker.id}
              onClick={() => setSelectedMarker(marker)}
              className="flex items-start gap-2 p-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/60 rounded-lg text-left transition-all hover:scale-[1.02]"
            >
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: getMarkerColor(marker.type) }} />
              <div>
                <h4 className="text-[11px] font-semibold text-slate-200 leading-tight">{marker.title}</h4>
                <p className="text-[9px] text-slate-400 line-clamp-1">{marker.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Marker Details */}
        {selectedMarker && (
          <div className="absolute bottom-4 right-4 left-4 z-20 bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-start justify-between shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                  {selectedMarker.type}
                </span>
                <h4 className="text-xs font-bold text-slate-200">{selectedMarker.title}</h4>
              </div>
              <p className="text-[11px] text-slate-400">{selectedMarker.description}</p>
            </div>
            <button 
              onClick={() => setSelectedMarker(null)} 
              className="text-slate-500 hover:text-slate-300 text-xs px-1"
              aria-label="Dismiss detail"
            >
              ✕
            </button>
          </div>
        )}

        {/* Setup Instructions Overlay Trigger */}
        {!pathCoordinates && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
            <div className="max-w-md bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-2xl">
              <div className="w-10 h-10 bg-sky-500/10 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Interactive Google Map Available</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Expose precise live routing, congestion heatmaps, and Google Places details by configuring your key.
              </p>
              
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setShowMockMap(false)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-slate-100 font-semibold text-xs rounded-md transition-colors"
                >
                  Setup API Key
                </button>
                <button
                  onClick={() => setShowMockMap(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-md transition-colors"
                >
                  Use Standalone Mode
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Google Maps Platform rendering
  return (
    <div className="w-full h-[400px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={15}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {activeMarkers.map(marker => (
            <AdvancedMarker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setSelectedMarker(marker)}
            >
              <Pin 
                background={getMarkerColor(marker.type)} 
                glyphColor="#fff" 
                borderColor="#1e293b"
              />
            </AdvancedMarker>
          ))}

          {/* Draw dynamic polyline overlay onto map */}
          <PolylineRenderer pathCoordinates={pathCoordinates} routeType={routeType} />

          {selectedMarker && (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="text-slate-900 p-1 font-sans">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] uppercase font-mono px-1 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                    {selectedMarker.type}
                  </span>
                  <h4 className="text-xs font-bold leading-none">{selectedMarker.title}</h4>
                </div>
                <p className="text-[10px] text-slate-600 leading-normal max-w-[200px]">{selectedMarker.description}</p>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Manual Setup Instruction Link in Map Corner */}
      <button
        onClick={() => setShowMockMap(true)}
        className="absolute top-2 right-2 z-10 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-md text-[10px] font-mono flex items-center gap-1.5 animate-pulse"
      >
        <Shield className="w-3 h-3 text-sky-400" />
        Key Config Info
      </button>
    </div>
  );
}
