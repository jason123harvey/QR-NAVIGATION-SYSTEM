import React from 'react';

export default class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D map failed to render:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="map-canvas-wrapper" aria-live="polite" aria-label="3D map unavailable fallback">
          <div className="map-toolbar" style={{ top: '1rem' }}>
            <div className="floor-switcher">
              <button type="button" className="floor-tab-btn active" disabled>
                3D map unavailable
              </button>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            height: '100%',
            background: '#0f172a',
            color: '#e2e8f0',
            padding: '2rem',
            textAlign: 'center',
            gap: '0.75rem'
          }}>
            <strong>3D Map temporarily unavailable</strong>
            <span style={{ color: '#cbd5e1' }}>Showing the existing 2D indoor map instead.</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
