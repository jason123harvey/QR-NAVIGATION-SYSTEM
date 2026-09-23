import React, { useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Layers, MapPin, Info, ArrowUpRight, Compass } from 'lucide-react';
import { getLocationIcon, formatFloor } from './LocationCard';

export default function IndoorMap({ 
  locations = [], 
  currentFloor = 0, 
  onFloorChange,
  routeData = null,
  activeStepIndex = 0,
  onSelectLocation = null,
  startLocation = null,
  destinationLocation = null
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [inspectedLocation, setInspectedLocation] = useState(null);

  // Available floors from building
  const availableFloors = [
    { floor: 0, label: 'Ground Floor' },
    { floor: 1, label: '1st Floor' },
    { floor: 2, label: '2nd Floor' },
  ];

  // Locations filtered for the current floor
  const floorLocations = useMemo(() => {
    return locations.filter((loc) => loc.floor === currentFloor);
  }, [locations, currentFloor]);

  // Extract path segments on current floor
  const currentFloorPathPoints = useMemo(() => {
    if (!routeData || !routeData.path_nodes) return [];
    
    // Filter contiguous nodes that belong to current floor
    const nodesOnFloor = routeData.path_nodes.filter((n) => n.floor === currentFloor);
    return nodesOnFloor;
  }, [routeData, currentFloor]);

  // Generate SVG polyline points string "x1,y1 x2,y2 ..."
  const pathPointsString = useMemo(() => {
    if (!currentFloorPathPoints || currentFloorPathPoints.length < 2) return '';
    return currentFloorPathPoints.map((n) => `${n.x_coordinate},${n.y_coordinate}`).join(' ');
  }, [currentFloorPathPoints]);

  // Check which floors contain the route
  const floorsWithRoute = useMemo(() => {
    if (!routeData || !routeData.floors_in_route) return [];
    return routeData.floors_in_route;
  }, [routeData]);

  // Helper color function for room shapes based on type
  const getNodeFill = (type) => {
    switch (type?.toLowerCase()) {
      case 'entrance':
        return '#059669'; // Emerald
      case 'laboratory':
        return '#2563eb'; // Blue
      case 'classroom':
        return '#d97706'; // Amber
      case 'library':
        return '#7c3aed'; // Purple
      case 'canteen':
      case 'facility':
        return '#ea580c'; // Orange
      case 'staircase':
        return '#ca8a04'; // Yellow
      case 'elevator':
        return '#9333ea'; // Magenta
      case 'department':
      case 'office':
        return '#4f46e5'; // Indigo
      case 'auditorium':
        return '#e11d48'; // Rose
      case 'reception':
        return '#0891b2'; // Cyan
      case 'corridor':
        return '#334155'; // Slate
      default:
        return '#475569';
    }
  };

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(Math.max(0.7, prev + delta), 2.2));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="map-canvas-wrapper">
      {/* Top Floating Toolbar */}
      <div className="map-toolbar">
        {/* Floor Switcher Tabs */}
        <div className="floor-switcher">
          {availableFloors.map((fl) => {
            const hasRouteOnThisFloor = floorsWithRoute.includes(fl.floor);
            return (
              <button
                key={fl.floor}
                className={`floor-tab-btn ${currentFloor === fl.floor ? 'active' : ''} ${hasRouteOnThisFloor ? 'has-route' : ''}`}
                onClick={() => onFloorChange(fl.floor)}
              >
                {fl.label}
              </button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            background: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            onClick={() => handleZoom(0.2)}
            style={{ padding: '6px', color: '#fff', borderRadius: '4px' }}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            style={{ padding: '6px', color: '#fff', borderRadius: '4px' }}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleResetZoom}
            style={{ padding: '6px', color: '#fff', borderRadius: '4px' }}
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="svg-map-viewport">
        <svg
          viewBox="0 0 800 600"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '1000px',
            maxHeight: '750px',
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.2s ease',
          }}
        >
          {/* Architectural Background & Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <filter id="glow-start" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-dest" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="800" height="600" fill="#0f172a" />
          <rect width="800" height="600" fill="url(#grid)" />

          {/* Building Boundary Walls */}
          <rect
            x="60"
            y="60"
            width="680"
            height="500"
            rx="24"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="4"
          />

          {/* Hallways / Corridors Base Lines */}
          <g stroke="#475569" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
            {/* Central Spine */}
            <line x1="400" y1="120" x2="400" y2="520" />
            {/* Horizontal Hallways */}
            <line x1="160" y1="340" x2="640" y2="340" />
            <line x1="160" y1="220" x2="640" y2="220" />
            <line x1="160" y1="440" x2="640" y2="440" />
          </g>

          {/* Render Room Blocks for Current Floor */}
          {floorLocations.map((loc) => {
            const isCorridor = loc.type === 'corridor';
            const isStart = startLocation && startLocation.location_code === loc.location_code;
            const isDest = destinationLocation && destinationLocation.location_code === loc.location_code;
            const width = isCorridor ? 24 : (loc.type === 'auditorium' || loc.type === 'library' ? 140 : 110);
            const height = isCorridor ? 24 : (loc.type === 'auditorium' || loc.type === 'library' ? 80 : 70);
            const rx = isCorridor ? 12 : 8;

            const fillColor = getNodeFill(loc.type);

            return (
              <g
                key={loc.location_code}
                className="room-node"
                onClick={() => setInspectedLocation(loc)}
                transform={`translate(${loc.x_coordinate}, ${loc.y_coordinate})`}
              >
                {/* Room Shape */}
                <rect
                  x={-width / 2}
                  y={-height / 2}
                  width={width}
                  height={height}
                  rx={rx}
                  fill={fillColor}
                  fillOpacity={isCorridor ? 0.3 : 0.85}
                  stroke={isStart ? '#10b981' : isDest ? '#ef4444' : '#ffffff'}
                  strokeWidth={isStart || isDest ? 3 : 1}
                  strokeOpacity={0.7}
                />

                {/* Text Label */}
                {!isCorridor && (
                  <>
                    <text
                      y="-4"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="var(--font-heading)"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {loc.name.length > 16 ? loc.name.substring(0, 14) + '…' : loc.name}
                    </text>
                    <text
                      y="12"
                      fill="rgba(255,255,255,0.7)"
                      fontSize="8"
                      fontWeight="500"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {loc.location_code}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Active Navigation Path Overlay */}
          {pathPointsString && (
            <g>
              {/* Outer Glow Path */}
              <polyline
                points={pathPointsString}
                fill="none"
                stroke="#6366f1"
                strokeWidth="12"
                strokeOpacity="0.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Animated Inner Dash Path */}
              <polyline
                className="animated-route-path"
                points={pathPointsString}
                fill="none"
                stroke="#a5b4fc"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Path Node Dots */}
              {currentFloorPathPoints.map((node, i) => (
                <circle
                  key={`dot-${i}`}
                  cx={node.x_coordinate}
                  cy={node.y_coordinate}
                  r="4"
                  fill="#ffffff"
                  stroke="#4f46e5"
                  strokeWidth="2"
                />
              ))}
            </g>
          )}

          {/* Start Marker (Green Radar Pulse) */}
          {startLocation && startLocation.floor === currentFloor && (
            <g transform={`translate(${startLocation.x_coordinate}, ${startLocation.y_coordinate})`}>
              <circle className="radar-marker" r="20" fill="#10b981" fillOpacity="0.4" />
              <circle r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" filter="url(#glow-start)" />
              <text y="-14" fill="#10b981" fontSize="10" fontWeight="800" textAnchor="middle">
                START
              </text>
            </g>
          )}

          {/* Destination Marker (Red Radar Pulse) */}
          {destinationLocation && destinationLocation.floor === currentFloor && (
            <g transform={`translate(${destinationLocation.x_coordinate}, ${destinationLocation.y_coordinate})`}>
              <circle className="radar-marker" r="20" fill="#ef4444" fillOpacity="0.4" />
              <circle r="9" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" filter="url(#glow-dest)" />
              <text y="-14" fill="#ef4444" fontSize="10" fontWeight="800" textAnchor="middle">
                DESTINATION
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Map Legend Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '0.6rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '1rem',
          fontSize: '0.75rem',
          color: '#cbd5e1',
          flexWrap: 'wrap',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
          Start
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span>
          Destination
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 14, height: 3, background: '#a5b4fc', borderRadius: 2 }}></span>
          Route Path
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ca8a04' }}></span>
          Stairs
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#9333ea' }}></span>
          Elevator
        </div>
      </div>

      {/* Inspected Location Modal Popup */}
      {inspectedLocation && (
        <div className="modal-backdrop" onClick={() => setInspectedLocation(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`loc-badge badge-${inspectedLocation.type}`}>
                  {getLocationIcon(inspectedLocation.type)}
                  {inspectedLocation.type}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {formatFloor(inspectedLocation.floor)}
                </span>
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setInspectedLocation(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {inspectedLocation.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {inspectedLocation.description || 'No detailed description available.'}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '4px' }}>
                Location Code: <strong>{inspectedLocation.location_code}</strong> • Coordinates: ({inspectedLocation.x_coordinate}, {inspectedLocation.y_coordinate})
              </div>
            </div>

            <div className="modal-footer">
              {onSelectLocation && (
                <>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      onSelectLocation('start', inspectedLocation);
                      setInspectedLocation(null);
                    }}
                  >
                    <MapPin size={14} style={{ color: 'var(--success)' }} />
                    Set Start
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      onSelectLocation('destination', inspectedLocation);
                      setInspectedLocation(null);
                    }}
                  >
                    <ArrowUpRight size={14} />
                    Set Destination
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
