import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowRight, MapPin, Building, Layers, Sparkles } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import { fetchLocationByCode, fetchLocations } from '../services/api';
import { formatFloor, getLocationIcon } from '../components/LocationCard';

export default function Scanner({ currentLocation, onSetCurrentLocation }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [detectedLocation, setDetectedLocation] = useState(currentLocation || null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [verifying, setVerifying] = useState(false);

  // Load available locations list
  useEffect(() => {
    fetchLocations()
      .then(setAvailableLocations)
      .catch(console.error);
  }, []);

  // Check URL query param e.g. /scan?location=MAIN_ENTRANCE
  useEffect(() => {
    const locParam = searchParams.get('location');
    if (locParam) {
      handleLocationCode(locParam);
    }
  }, [searchParams]);

  const handleLocationCode = async (rawCode) => {
    setErrorMessage(null);
    setVerifying(true);
    try {
      const loc = await fetchLocationByCode(rawCode);
      setDetectedLocation(loc);
      if (onSetCurrentLocation) {
        onSetCurrentLocation(loc);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        `Invalid QR Code or location "${rawCode}" not found. Please scan a valid indoor navigation QR code.`
      );
      setDetectedLocation(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleProceedToDestination = () => {
    if (detectedLocation) {
      navigate(`/navigate?source=${detectedLocation.location_code}`);
    }
  };

  return (
    <div className="scanner-page-container">
      {/* QR Scanner Module */}
      <QRScanner
        onScanSuccess={handleLocationCode}
        availableLocations={availableLocations}
      />

      {/* Verification Spinner */}
      {verifying && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--primary)' }}>
          Verifying indoor location code...
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
            background: 'var(--danger-light)',
            border: '1px solid #fca5a5',
            borderRadius: 'var(--radius-md)',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem',
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Detected Location Card */}
      {detectedLocation && (
        <div className="detected-card">
          <div className="detected-header">
            <CheckCircle2 size={20} />
            <span>QR Code Detected ✓</span>
          </div>

          <h3 className="detected-title">{detectedLocation.name}</h3>

          <div className="detected-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building size={16} />
              {detectedLocation.building}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Layers size={16} />
              {formatFloor(detectedLocation.floor)}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Code: {detectedLocation.location_code}
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#065f46', marginBottom: '1.25rem' }}>
            {detectedLocation.description || 'Current indoor location confirmed.'}
          </p>

          <button
            onClick={handleProceedToDestination}
            className="btn btn-success btn-lg"
            style={{ width: '100%', fontSize: '1.05rem' }}
          >
            <span>Choose Destination</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
