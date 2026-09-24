import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Navigation as NavIcon, QrCode, Search, MapPin, AlertCircle, 
  ArrowRight, ArrowLeftRight, Layers, Footprints, Clock, RotateCcw 
} from 'lucide-react';
import IndoorMap from '../components/IndoorMap';
import NavigationPanel from '../components/NavigationPanel';
import DestinationSearch from '../components/DestinationSearch';
import { fetchLocations, fetchLocationByCode, fetchRoute } from '../services/api';
import { formatFloor } from '../components/LocationCard';
import { findDestinationMatches, normalizeSpokenDestination, speakText } from '../utils/speech';

export default function Navigation({ currentLocation, onSetCurrentLocation }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [startLoc, setStartLoc] = useState(currentLocation || null);
  const [destLoc, setDestLoc] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [activeFloor, setActiveFloor] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [voiceSearchTerm, setVoiceSearchTerm] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceMatches, setVoiceMatches] = useState([]);
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  // Load all locations for the map & search
  useEffect(() => {
    fetchLocations()
      .then((data) => {
        setLocations(data);
      })
      .catch(console.error);
  }, []);

  // Synchronize URL parameters `source` and `destination`
  useEffect(() => {
    const srcCode = searchParams.get('source');
    const dstCode = searchParams.get('destination');

    const resolveEndpoints = async () => {
      let resolvedStart = startLoc;
      let resolvedDest = destLoc;

      if (srcCode && (!startLoc || startLoc.location_code !== srcCode)) {
        try {
          const fetchedSrc = await fetchLocationByCode(srcCode);
          resolvedStart = fetchedSrc;
          setStartLoc(fetchedSrc);
          if (onSetCurrentLocation) onSetCurrentLocation(fetchedSrc);
        } catch (e) {
          console.warn('Could not resolve source code:', srcCode);
        }
      }

      if (dstCode && (!destLoc || destLoc.location_code !== dstCode)) {
        try {
          const fetchedDst = await fetchLocationByCode(dstCode);
          resolvedDest = fetchedDst;
          setDestLoc(fetchedDst);
        } catch (e) {
          console.warn('Could not resolve destination code:', dstCode);
        }
      }

      // If both start and destination are resolved, compute route
      if (resolvedStart && resolvedDest) {
        calculateNavigationRoute(resolvedStart.location_code, resolvedDest.location_code, resolvedStart.floor);
      }
    };

    resolveEndpoints();
  }, [searchParams]);

  const calculateNavigationRoute = async (srcCode, dstCode, defaultFloor) => {
    setLoadingRoute(true);
    setRouteError(null);
    try {
      const data = await fetchRoute(srcCode, dstCode);
      setRouteData(data);
      setActiveStepIndex(0);
      setActiveFloor(data.source_floor !== undefined ? data.source_floor : defaultFloor || 0);
    } catch (err) {
      console.error(err);
      setRouteError(err.message || 'No route is available between these locations.');
      setRouteData(null);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleSelectDestination = (destination) => {
    setDestLoc(destination);
    setVoiceMatches([]);
    const srcCode = startLoc ? startLoc.location_code : 'MAIN_ENTRANCE';
    if (!startLoc && locations.length > 0) {
      const defaultStart = locations.find((l) => l.location_code === 'MAIN_ENTRANCE') || locations[0];
      setStartLoc(defaultStart);
    }
    setSearchParams({ source: srcCode, destination: destination.location_code });
  };

  const handleVoiceTranscript = (transcript) => {
    setVoiceTranscript(transcript);
    if (!transcript) {
      setVoiceMatches([]);
      return;
    }
    const matches = findDestinationMatches(transcript, locations, startLoc);
    setVoiceMatches(matches.slice(0, 5));
    if (matches.length === 1) {
      speakText(`I found ${matches[0].name} on the ${formatFloor(matches[0].floor).toLowerCase()}. Please confirm the destination.`);
    }
  };

  const handleReverseRoute = () => {
    if (startLoc && destLoc) {
      const newSrc = destLoc;
      const newDst = startLoc;
      setStartLoc(newSrc);
      setDestLoc(newDst);
      setSearchParams({ source: newSrc.location_code, destination: newDst.location_code });
    }
  };

  const handleReset = () => {
    setDestLoc(null);
    setRouteData(null);
    setRouteError(null);
    if (startLoc) {
      setSearchParams({ source: startLoc.location_code });
    } else {
      setSearchParams({});
    }
  };

  const handleMapLocationSelect = (role, location) => {
    if (role === 'start') {
      setStartLoc(location);
      if (onSetCurrentLocation) onSetCurrentLocation(location);
      if (destLoc) {
        setSearchParams({ source: location.location_code, destination: destLoc.location_code });
      } else {
        setSearchParams({ source: location.location_code });
      }
    } else if (role === 'destination') {
      handleSelectDestination(location);
    }
  };

  return (
    <div className={`navigation-page-container ${accessibilityMode ? 'accessibility-mode' : ''}`}>
      <div className="nav-split-layout">
        {/* Left Side Navigation / Search Panel */}
        <div className="nav-sidebar">
          <label className="accessibility-toggle" style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <input
              type="checkbox"
              checked={accessibilityMode}
              onChange={(event) => setAccessibilityMode(event.target.checked)}
            />
            <span>Accessibility mode</span>
          </label>
          {/* Destination Selection State (If route is not computed or user is picking destination) */}
          {!routeData ? (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                  Indoor Route Planner
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Select your current location and where you want to go
                </p>
              </div>

              {/* Start Location Picker */}
              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    STARTING FROM
                  </span>
                  <button
                    onClick={() => navigate('/scan')}
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}
                  >
                    <QrCode size={13} />
                    Scan QR
                  </button>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {startLoc ? startLoc.name : 'Main Entrance (Default)'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {startLoc ? `${formatFloor(startLoc.floor)} • ${startLoc.building}` : 'Ground Floor • Main Building'}
                </div>
              </div>

              {/* Loading Spinner */}
              {loadingRoute && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--primary)' }}>
                  Computing shortest indoor route using Dijkstra algorithm...
                </div>
              )}

              {/* Error Notice */}
              {routeError && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--danger-light)',
                    border: '1px solid #fca5a5',
                    borderRadius: 'var(--radius-md)',
                    color: '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>{routeError}</div>
                </div>
              )}

              {/* Search Box */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                  Choose Destination
                </label>
                <DestinationSearch
                  locations={locations}
                  currentLocation={startLoc}
                  onSelectDestination={handleSelectDestination}
                  searchTerm={voiceSearchTerm}
                  onSearchTermChange={(value) => {
                    setVoiceSearchTerm(value);
                    if (!value) setVoiceMatches([]);
                  }}
                  onVoiceTranscript={handleVoiceTranscript}
                />
                {voiceMatches.length > 0 && (
                  <div className="voice-destination-confirmation" aria-live="polite">
                    <div>
                      <strong>{voiceMatches.length === 1 ? 'Destination found' : 'Choose a destination'}</strong>
                      <span>{voiceMatches.length === 1 ? 'Confirm the location before starting navigation.' : `Matches for “${normalizeSpokenDestination(voiceSearchTerm)}”.`}</span>
                    </div>
                    {voiceMatches.map((location) => (
                      <div key={location.location_code} className="voice-match-row">
                        <div>
                          <strong>{location.name}</strong>
                          <span>{formatFloor(location.floor)} • {location.building}</span>
                        </div>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleSelectDestination(location)}>
                          Confirm
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setVoiceMatches([])}>
                      Try again
                    </button>
                  </div>
                )}
                {voiceTranscript && voiceMatches.length === 0 && (
                  <div className="voice-destination-confirmation voice-destination-empty" role="status">
                    No matching destination found. Try a shorter name or type your destination.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Active Route Guidance Panel */
            <NavigationPanel
              routeData={routeData}
              currentLocation={startLoc}
              activeStepIndex={activeStepIndex}
              onStepChange={setActiveStepIndex}
              onReverseRoute={handleReverseRoute}
              onReset={handleReset}
              onSwitchFloor={setActiveFloor}
            />
          )}
        </div>

        {/* Right Side Interactive Multi-Floor SVG Map */}
        <IndoorMap
          locations={locations}
          currentFloor={activeFloor}
          onFloorChange={setActiveFloor}
          routeData={routeData}
          activeStepIndex={activeStepIndex}
          startLocation={startLoc}
          destinationLocation={destLoc}
          onSelectLocation={handleMapLocationSelect}
        />
      </div>
    </div>
  );
}
