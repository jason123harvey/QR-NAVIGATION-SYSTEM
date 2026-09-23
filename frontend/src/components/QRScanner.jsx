import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle, Search, Sparkles, CheckCircle2 } from 'lucide-react';

export default function QRScanner({ onScanSuccess, availableLocations = [] }) {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const qrScannerRef = useRef(null);

  // Parse location code from QR string or URL
  const extractLocationCode = (qrText) => {
    if (!qrText) return '';
    try {
      if (qrText.includes('location=')) {
        const urlObj = new URL(qrText, window.location.origin);
        const locParam = urlObj.searchParams.get('location');
        if (locParam) return locParam.toUpperCase().trim();
      }
    } catch (e) {
      // Not a valid URL, treat as raw text
    }
    return qrText.toUpperCase().trim();
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode('reader');
      qrScannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          const code = extractLocationCode(decodedText);
          stopScanner();
          if (onScanSuccess) {
            onScanSuccess(code);
          }
        },
        (errorMessage) => {
          // Frame parse failure - ignore normal scanning misses
        }
      );
      setScanning(true);
    } catch (err) {
      console.warn('Camera scan initialization failed:', err);
      setCameraError(
        'Camera access unavailable or permission denied. You can manually enter or select your indoor location code below.'
      );
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (qrScannerRef.current && scanning) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (e) {
        console.error('Failed to stop scanner:', e);
      }
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = extractLocationCode(manualCode);
    if (code && onScanSuccess) {
      onScanSuccess(code);
    }
  };

  return (
    <div className="scanner-box">
      {/* Scanner Header */}
      <div className="scanner-header">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
          Indoor QR Code Scanner
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Point your device camera at the QR sign on the wall or door
        </p>
      </div>

      {/* Camera Live Preview / Fallback Screen */}
      <div className="camera-preview-area">
        <div id="reader"></div>

        {/* Viewfinder Overlay when active */}
        {scanning && (
          <div className="camera-target-overlay">
            <div className="camera-target-corners"></div>
          </div>
        )}

        {/* Placeholder when camera is off */}
        {!scanning && (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              color: '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Camera size={32} />
            </div>
            <div>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '1.1rem' }}>
                Camera is Inactive
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                Click below to start your device camera and scan indoor QR codes
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', display: 'flex', justifyContent: 'center' }}>
        {!scanning ? (
          <button onClick={startScanner} className="btn btn-primary" style={{ width: '100%' }}>
            <Camera size={18} />
            <span>Start Camera Scanner</span>
          </button>
        ) : (
          <button onClick={stopScanner} className="btn btn-secondary" style={{ width: '100%' }}>
            <CameraOff size={18} />
            <span>Stop Camera</span>
          </button>
        )}
      </div>

      {/* Permission Warning Notice if camera fails */}
      {cameraError && (
        <div
          style={{
            margin: '1rem 1.5rem 0',
            padding: '0.85rem 1rem',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            fontSize: '0.85rem',
            color: '#92400e',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{cameraError}</div>
        </div>
      )}

      {/* Manual Input Fallback */}
      <div className="manual-input-box">
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Manual QR / Location Code Fallback
        </label>
        <form onSubmit={handleManualSubmit} className="input-group">
          <input
            type="text"
            className="input-control"
            placeholder="e.g., MAIN_ENTRANCE, CSE_LAB_1, RECEPTION"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={16} />
            <span>Submit</span>
          </button>
        </form>

        {/* Quick Location Pills for Demonstration */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
            QUICK SAMPLE LOCATIONS:
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['MAIN_ENTRANCE', 'RECEPTION', 'CSE_DEPT', 'LIBRARY', 'ECE_DEPT'].map((locCode) => (
              <button
                key={locCode}
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setManualCode(locCode);
                  if (onScanSuccess) onScanSuccess(locCode);
                }}
              >
                {locCode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
