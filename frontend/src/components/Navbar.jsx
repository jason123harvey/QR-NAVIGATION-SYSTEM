import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navigation, QrCode, Map, Settings, Compass, Menu, X, MapPin } from 'lucide-react';

export default function Navbar({ currentLocation }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: Compass },
    { path: '/scan', label: 'Scan QR', icon: QrCode },
    { path: '/navigate', label: 'Navigation', icon: Navigation },
    { path: '/map', label: 'Explore Map', icon: Map },
    { path: '/admin', label: 'Admin', icon: Settings },
  ];

  return (
    <header className="navbar">
      <Link to="/" className="nav-brand">
        <div className="brand-icon-box">
          <Navigation size={22} />
        </div>
        <div>
          <span>NaviQR</span>
          <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-muted)', fontWeight: 500 }}>
            Indoor Campus Map
          </span>
        </div>
      </Link>

      {/* Desktop Navigation Links */}
      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Current Location Badge if set */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {currentLocation && (
          <div
            className="nav-current-badge"
            title={`Current Location: ${currentLocation.name}`}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/scan')}
          >
            <span className="pulse-dot"></span>
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentLocation.name}
            </span>
          </div>
        )}

        {/* Mobile menu trigger */}
        <button
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.4rem', display: 'inline-flex' }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            borderBottom: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 100,
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                style={{ padding: '0.75rem 1rem' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
