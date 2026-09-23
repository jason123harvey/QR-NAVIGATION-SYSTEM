import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Search, MapPin, ArrowRight, Filter, Building2 } from 'lucide-react';
import IndoorMap from '../components/IndoorMap';
import LocationCard from '../components/LocationCard';
import { fetchLocations } from '../services/api';

export default function MapPage({ currentLocation, onSetCurrentLocation }) {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchLocations().then(setLocations).catch(console.error);
  }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (loc.floor !== currentFloor) return false;
      if (selectedType !== 'all') {
        if (selectedType === 'facility' && !['facility', 'canteen', 'auditorium', 'office'].includes(loc.type)) {
          return false;
        } else if (selectedType !== 'facility' && loc.type !== selectedType) {
          return false;
        }
      }
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.location_code.toLowerCase().includes(q) ||
        (loc.description && loc.description.toLowerCase().includes(q))
      );
    });
  }, [locations, currentFloor, selectedType, searchTerm]);

  const handleStartNavigation = (loc) => {
    const srcCode = currentLocation ? currentLocation.location_code : 'MAIN_ENTRANCE';
    navigate(`/navigate?source=${srcCode}&destination=${loc.location_code}`);
  };

  const handleSetStart = (loc) => {
    if (onSetCurrentLocation) onSetCurrentLocation(loc);
    navigate(`/navigate?source=${loc.location_code}`);
  };

  const handleMapLocationSelect = (role, loc) => {
    if (role === 'start') {
      handleSetStart(loc);
    } else {
      handleStartNavigation(loc);
    }
  };

  return (
    <div className="navigation-page-container">
      <div className="nav-split-layout">
        {/* Left Side Location Explorer List */}
        <div className="nav-sidebar">
          <div className="nav-sidebar-header">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              Campus Map Explorer
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Inspect rooms, laboratories, facilities, and vertical transit hubs
            </p>

            {/* Search Input */}
            <input
              type="text"
              className="input-control"
              style={{ width: '100%', marginBottom: '0.75rem' }}
              placeholder="Search places on this floor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Type filters */}
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'laboratory', label: 'Labs' },
                { id: 'classroom', label: 'Classes' },
                { id: 'department', label: 'Dept' },
                { id: 'facility', label: 'Amenities' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: selectedType === t.id ? 'var(--primary)' : 'var(--bg-card)',
                    color: selectedType === t.id ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location List on Current Floor */}
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              LOCATIONS ON THIS FLOOR ({filteredLocations.length})
            </div>

            {filteredLocations.map((loc) => (
              <LocationCard
                key={loc.location_code}
                location={loc}
                onSelectStart={() => handleSetStart(loc)}
                onSelectDestination={() => handleStartNavigation(loc)}
              />
            ))}
          </div>
        </div>

        {/* Right Side Map Canvas */}
        <IndoorMap
          locations={locations}
          currentFloor={currentFloor}
          onFloorChange={setCurrentFloor}
          startLocation={currentLocation}
          onSelectLocation={handleMapLocationSelect}
        />
      </div>
    </div>
  );
}
