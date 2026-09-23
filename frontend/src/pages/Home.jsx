import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  QrCode, Map, Compass, Navigation, ArrowRight, 
  Layers, Sparkles, Building2, MapPin, CheckCircle2 
} from 'lucide-react';
import { fetchLocations } from '../services/api';
import LocationCard from '../components/LocationCard';

export default function Home({ onSetCurrentLocation }) {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations()
      .then((data) => {
        setLocations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load locations on Home:', err);
        setLoading(false);
      });
  }, []);

  const handleQuickStart = (location) => {
    if (onSetCurrentLocation) {
      onSetCurrentLocation(location);
    }
    navigate(`/scan?location=${location.location_code}`);
  };

  const handleNavigateTo = (location) => {
    navigate(`/navigate?destination=${location.location_code}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>Smart Campus Navigation System</span>
        </div>

        <h1 className="hero-title">
          QR <span className="gradient-text">Indoor Navigation</span> System
        </h1>

        <p className="hero-subtitle">
          Find your destination inside complex college buildings, hospitals, and campus blocks with ease using interactive QR codes and multi-floor Dijkstra routing.
        </p>

        <div className="hero-actions">
          <Link to="/scan" className="btn btn-primary btn-lg">
            <QrCode size={20} />
            <span>Scan QR Code</span>
          </Link>
          <Link to="/map" className="btn btn-secondary btn-lg">
            <Map size={20} />
            <span>Explore Map</span>
          </Link>
          <a href="#locations-directory" className="btn btn-secondary btn-lg">
            <Building2 size={20} />
            <span>Available Locations</span>
          </a>
        </div>
      </section>

      {/* 4-Step Intelligent Workflow Section */}
      <section className="workflow-section">
        <div className="section-header">
          <h2 className="section-title">How Indoor Navigation Works</h2>
          <p className="section-desc">
            Seamless indoor orientation without relying on weak GPS signals
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span className="step-number">01</span>
            <div className="step-icon-box">
              <QrCode size={24} />
            </div>
            <h3>1. Scan a QR Code</h3>
            <p>Scan any QR code marker mounted on walls, doorways, entrance halls, or elevators.</p>
          </div>

          <div className="step-card">
            <span className="step-number">02</span>
            <div className="step-icon-box" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <MapPin size={24} />
            </div>
            <h3>2. Location Detected</h3>
            <p>The system verifies the indoor node, floor elevation, and coordinates immediately.</p>
          </div>

          <div className="step-card">
            <span className="step-number">03</span>
            <div className="step-icon-box" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <Compass size={24} />
            </div>
            <h3>3. Select Destination</h3>
            <p>Search any classroom, AI laboratory, library, faculty room, or canteen across any floor.</p>
          </div>

          <div className="step-card">
            <span className="step-number">04</span>
            <div className="step-icon-box" style={{ background: '#fef3c7', color: '#b45309' }}>
              <Navigation size={24} />
            </div>
            <h3>4. Follow the Route</h3>
            <p>Follow turn-by-turn guidance and live animated paths rendered on the interactive SVG indoor map.</p>
          </div>
        </div>
      </section>

      {/* Quick Start Locations Directory */}
      <section id="locations-directory" className="quickstart-section">
        <div className="section-header" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="section-title">Available Campus Locations</h2>
            <p className="section-desc">
              ABC Engineering College • Main Block (Ground, 1st & 2nd Floors)
            </p>
          </div>
          <Link to="/map" className="btn btn-sm btn-outline-primary">
            <span>View Full Directory</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading building locations...
          </div>
        ) : (
          <div className="quickstart-grid">
            {locations.slice(0, 9).map((loc) => (
              <LocationCard
                key={loc.location_code}
                location={loc}
                onSelectStart={() => handleQuickStart(loc)}
                onSelectDestination={() => handleNavigateTo(loc)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
