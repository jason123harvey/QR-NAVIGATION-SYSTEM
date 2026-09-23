import React from 'react';
import { 
  DoorOpen, BookOpen, FlaskConical, GraduationCap, 
  Coffee, Building, Layers, ArrowRight, MapPin, Eye 
} from 'lucide-react';

export function getLocationIcon(type) {
  switch (type?.toLowerCase()) {
    case 'entrance':
      return <DoorOpen size={16} />;
    case 'laboratory':
      return <FlaskConical size={16} />;
    case 'classroom':
      return <GraduationCap size={16} />;
    case 'library':
      return <BookOpen size={16} />;
    case 'canteen':
    case 'facility':
      return <Coffee size={16} />;
    default:
      return <Building size={16} />;
  }
}

export function formatFloor(floorNum) {
  if (floorNum === 0) return 'Ground Floor';
  if (floorNum === 1) return '1st Floor';
  if (floorNum === 2) return '2nd Floor';
  if (floorNum === 3) return '3rd Floor';
  return `Floor ${floorNum}`;
}

export default function LocationCard({ 
  location, 
  onSelectStart, 
  onSelectDestination, 
  onInspect,
  isCurrent = false 
}) {
  const typeClass = `badge-${location.type || 'room'}`;

  return (
    <div className={`location-item-card ${isCurrent ? 'current-active' : ''}`}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span className={`loc-badge ${typeClass}`}>
            {getLocationIcon(location.type)}
            <span>{location.type}</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Layers size={13} />
            {formatFloor(location.floor)}
          </span>
        </div>

        <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
          {location.name}
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {location.description || `${location.building} • Code: ${location.location_code}`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {onSelectStart && (
          <button
            onClick={() => onSelectStart(location)}
            className="btn btn-sm btn-secondary"
            style={{ flex: 1 }}
          >
            <MapPin size={13} style={{ color: 'var(--success)' }} />
            Start Here
          </button>
        )}
        {onSelectDestination && (
          <button
            onClick={() => onSelectDestination(location)}
            className="btn btn-sm btn-primary"
            style={{ flex: 1 }}
          >
            <ArrowRight size={13} />
            Go Here
          </button>
        )}
        {onInspect && (
          <button
            onClick={() => onInspect(location)}
            className="btn btn-sm btn-secondary"
            title="Inspect Details"
          >
            <Eye size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
