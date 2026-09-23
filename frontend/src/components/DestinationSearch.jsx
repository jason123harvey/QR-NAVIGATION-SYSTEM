import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, Navigation, Filter, Sparkles } from 'lucide-react';
import { getLocationIcon, formatFloor } from './LocationCard';

export default function DestinationSearch({ 
  locations = [], 
  currentLocation, 
  onSelectDestination,
  placeholder = "Search destination (e.g., Computer Lab, Library, ECE)..." 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Places' },
    { id: 'laboratory', label: 'Labs' },
    { id: 'classroom', label: 'Classrooms' },
    { id: 'department', label: 'Departments' },
    { id: 'library', label: 'Library' },
    { id: 'facility', label: 'Amenities' },
  ];

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      // Exclude current location from destinations
      if (currentLocation && loc.location_code === currentLocation.location_code) {
        return false;
      }
      // Floor filter
      if (selectedFloor !== 'all' && loc.floor !== parseInt(selectedFloor, 10)) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'facility' && !['facility', 'canteen', 'auditorium', 'office'].includes(loc.type)) {
          return false;
        } else if (selectedCategory !== 'facility' && loc.type !== selectedCategory) {
          return false;
        }
      }
      // Search term matching
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.location_code.toLowerCase().includes(q) ||
        (loc.description && loc.description.toLowerCase().includes(q)) ||
        (loc.building && loc.building.toLowerCase().includes(q))
      );
    });
  }, [locations, currentLocation, searchTerm, selectedFloor, selectedCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Search Input Bar */}
      <div style={{ position: 'relative' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          className="input-control"
          style={{
            width: '100%',
            paddingLeft: '2.75rem',
            paddingRight: searchTerm ? '2.5rem' : '1rem',
            fontSize: '1rem',
          }}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category Pills & Floor Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', alignItems: 'center' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: selectedCategory === cat.id ? 'var(--primary)' : 'var(--bg-card)',
              color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: selectedCategory === cat.id ? 'var(--primary)' : 'var(--border-subtle)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.label}
          </button>
        ))}

        <select
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
          style={{
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Floors</option>
          <option value="0">Ground Floor</option>
          <option value="1">1st Floor</option>
          <option value="2">2nd Floor</option>
        </select>
      </div>

      {/* Results Dropdown / List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: '340px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {filteredLocations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            No locations found matching your search.
          </div>
        ) : (
          filteredLocations.map((loc) => (
            <div
              key={loc.location_code}
              onClick={() => onSelectDestination(loc)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  {getLocationIcon(loc.type)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {loc.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {formatFloor(loc.floor)} • {loc.building}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-sm btn-primary"
                style={{ pointerEvents: 'none' }}
              >
                <Navigation size={13} />
                <span>Navigate</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
