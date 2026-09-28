import React, { useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line, Text, Float } from '@react-three/drei';
import { formatFloor } from './LocationCard';

const FLOOR_HEIGHT = 4;
const getYForFloor = (floor) => floor * FLOOR_HEIGHT;

function getLocationColor(type = '') {
  const normalized = String(type).toLowerCase();
  switch (normalized) {
    case 'entrance':
      return '#10b981';
    case 'laboratory':
      return '#3b82f6';
    case 'classroom':
      return '#f59e0b';
    case 'library':
      return '#8b5cf6';
    case 'canteen':
    case 'facility':
      return '#f97316';
    case 'staircase':
      return '#eab308';
    case 'elevator':
      return '#a855f7';
    case 'department':
    case 'office':
      return '#6366f1';
    case 'auditorium':
      return '#ec4899';
    case 'reception':
      return '#06b6d4';
    case 'corridor':
      return '#334155';
    default:
      return '#475569';
  }
}

function getFloorLabel(floor) {
  if (floor === 0) return 'Floor 1';
  if (floor === 1) return 'Floor 2';
  if (floor === 2) return 'Floor 3';
  return `Floor ${floor + 1}`;
}

function BuildingModel({ locations = [], currentFloor = 0, routeData = null, startLocation = null, currentLocation = null, destinationLocation = null, activeStepIndex = 0, onFloorChange = null }) {
  const routeNodes = routeData?.path_nodes || [];
  const selectedCurrent = currentLocation || startLocation || routeNodes[0] || null;
  const destinationNode = destinationLocation || routeData?.path_nodes?.[routeData.path_nodes.length - 1] || null;
  const floorList = useMemo(() => {
    const floors = [...new Set(locations.map((loc) => Number(loc.floor)).filter((value) => Number.isFinite(value)))];
    return floors.sort((a, b) => a - b);
  }, [locations]);

  const displayFloors = floorList.length ? floorList : [0, 1, 2];
  const routeSegments = useMemo(() => {
    if (!routeNodes.length) return [];
    return routeNodes.slice(0, routeNodes.length - 1).map((node, index) => {
      const next = routeNodes[index + 1];
      const isCompleted = index < activeStepIndex;
      const isCurrent = index === activeStepIndex;
      return {
        from: node,
        to: next,
        color: isCompleted ? '#9ca3af' : isCurrent ? '#f97316' : '#60a5fa',
        opacity: isCompleted ? 0.3 : isCurrent ? 1 : 0.75,
      };
    });
  }, [routeNodes, activeStepIndex]);

  return (
    <group>
      {displayFloors.map((floor) => {
        const floorY = getYForFloor(floor);
        const floorLocations = locations.filter((loc) => Number(loc.floor) === Number(floor));
        return (
          <group key={`floor-${floor}`} position={[0, floorY, 0]} visible={floor === currentFloor || floorLocations.some((loc) => routeNodes.some((node) => node.location_code === loc.location_code))}>
            <mesh position={[0, -0.25, 0]} receiveShadow>
              <boxGeometry args={[18, 0.4, 12]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <Text position={[0, 0.6, -4.8]} fontSize={0.45} color="#e2e8f0" anchorX="center" anchorY="middle">
              {getFloorLabel(floor)}
            </Text>
            {floorLocations.map((loc) => {
              const isCurrent = selectedCurrent && selectedCurrent.location_code === loc.location_code;
              const isDestination = destinationNode && destinationNode.location_code === loc.location_code;
              const x = Number(loc.x_coordinate || 0) / 50 - 8;
              const z = Number(loc.y_coordinate || 0) / 55 - 6;
              const width = loc.type === 'corridor' ? 0.8 : (loc.type === 'auditorium' || loc.type === 'library' ? 2.1 : 1.6);
              const depth = loc.type === 'corridor' ? 0.8 : (loc.type === 'auditorium' || loc.type === 'library' ? 1.4 : 1.2);
              return (
                <group key={loc.location_code} position={[x, 0.1, z]}>
                  <mesh castShadow receiveShadow>
                    <boxGeometry args={[width, 0.4, depth]} />
                    <meshStandardMaterial color={getLocationColor(loc.type)} emissive={isCurrent ? '#f97316' : isDestination ? '#22c55e' : '#0f172a'} emissiveIntensity={isCurrent || isDestination ? 0.6 : 0.1} />
                  </mesh>
                  <Text position={[0, 0.7, 0]} fontSize={0.24} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={2.2}>
                    {loc.name.length > 12 ? `${loc.name.slice(0, 12)}…` : loc.name}
                  </Text>
                  {isCurrent && (
                    <Float floatIntensity={2} rotationIntensity={1.5}>
                      <mesh position={[0, 1.4, 0]}>
                        <coneGeometry args={[0.35, 0.9, 12]} />
                        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.8} />
                      </mesh>
                    </Float>
                  )}
                  {isDestination && (
                    <Float floatIntensity={2} rotationIntensity={1.5}>
                      <mesh position={[0, 1.4, 0]}>
                        <cylinderGeometry args={[0.26, 0.26, 0.8, 20]} />
                        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
                      </mesh>
                    </Float>
                  )}
                </group>
              );
            })}
          </group>
        );
      })}

      {routeSegments.map((segment, index) => {
        const start = segment.from;
        const end = segment.to;
        if (!start || !end) return null;
        const startX = Number(start.x_coordinate || 0) / 50 - 8;
        const startZ = Number(start.y_coordinate || 0) / 55 - 6;
        const endX = Number(end.x_coordinate || 0) / 50 - 8;
        const endZ = Number(end.y_coordinate || 0) / 55 - 6;
        const yMid = getYForFloor(start.floor) + 0.6;
        return (
          <Line
            key={`route-${index}`}
            points={[[startX, yMid, startZ], [endX, yMid, endZ]]}
            color={segment.color}
            lineWidth={Math.max(2, segment.isCurrent ? 4 : 3)}
            opacity={segment.opacity}
            transparent
          />
        );
      })}

      {routeData?.path_nodes?.length > 1 && routeData.path_nodes.map((node, index) => {
        const x = Number(node.x_coordinate || 0) / 50 - 8;
        const z = Number(node.y_coordinate || 0) / 55 - 6;
        const y = getYForFloor(node.floor) + 0.8;
        return (
          <Html key={`${node.location_code}-${index}`} position={[x, y, z]} center>
            <div style={{
              background: index === 0 ? '#f97316' : index === routeData.path_nodes.length - 1 ? '#22c55e' : '#60a5fa',
              color: '#fff',
              borderRadius: '999px',
              padding: '3px 7px',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.35)',
              whiteSpace: 'nowrap',
            }}>
              {node.location_code}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

function Scene({ locations, currentFloor, routeData, startLocation, currentLocation, destinationLocation, activeStepIndex, onFloorChange }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (!groupRef.current) return;
    const targetRotation = state.clock.elapsedTime * 0.1;
    groupRef.current.rotation.y = targetRotation;
  });

  return (
    <group ref={groupRef} rotation={[0.35, 0.75, 0]}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[10, 12, 5]} intensity={1.2} castShadow />
      <spotLight position={[0, 14, 0]} intensity={0.8} angle={0.45} penumbra={0.5} />
      <BuildingModel
        locations={locations}
        currentFloor={currentFloor}
        routeData={routeData}
        startLocation={startLocation}
        currentLocation={currentLocation}
        destinationLocation={destinationLocation}
        activeStepIndex={activeStepIndex}
        onFloorChange={onFloorChange}
      />
    </group>
  );
}

export default function IndoorMap3D({
  locations = [],
  currentFloor = 0,
  onFloorChange,
  routeData = null,
  activeStepIndex = 0,
  startLocation = null,
  currentLocation = null,
  destinationLocation = null,
  trackingMode = 'unknown',
  trackingConfidence = 'Unknown',
  onSelectLocation = null,
}) {
  const [fallbackMessage, setFallbackMessage] = useState('');

  const statusLabel = trackingConfidence || 'Unknown';

  return (
    <div className="map-canvas-wrapper" aria-label="3D indoor map">
      <div className="map-toolbar" style={{ top: '4.5rem' }}>
        <div className="floor-switcher">
          {[0, 1, 2].map((floor) => (
            <button
              key={floor}
              type="button"
              className={`floor-tab-btn ${currentFloor === floor ? 'active' : ''}`}
              onClick={() => onFloorChange && onFloorChange(floor)}
            >
              {formatFloor(floor)}
            </button>
          ))}
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '999px',
          padding: '0.38rem 0.8rem',
          color: '#e2e8f0',
          fontSize: '0.78rem',
          fontWeight: 700,
        }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: trackingMode === 'qr' ? '#f59e0b' : trackingMode === 'estimated' ? '#facc15' : '#ef4444' }} />
          {statusLabel}
        </div>
      </div>

      {fallbackMessage ? (
        <div style={{ padding: '1rem', color: '#fff' }}>{fallbackMessage}</div>
      ) : (
        <Canvas camera={{ position: [10, 10, 12], fov: 45 }} shadows>
          <Suspense fallback={<Html center><div style={{ color: '#fff' }}>Loading 3D map…</div></Html>}>
            <Scene
              locations={locations}
              currentFloor={currentFloor}
              routeData={routeData}
              startLocation={startLocation}
              currentLocation={currentLocation}
              destinationLocation={destinationLocation}
              activeStepIndex={activeStepIndex}
              onFloorChange={onFloorChange}
            />
            <OrbitControls enablePan enableZoom enableRotate />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
