import React, { useState } from 'react';
import { 
  ArrowRight, ArrowLeftRight, Clock, Footprints, Layers, 
  CheckCircle2, Volume2, ChevronRight, ChevronLeft, Sparkles, Share2, MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatFloor } from './LocationCard';

export default function NavigationPanel({ 
  routeData, 
  onReverseRoute, 
  onReset,
  activeStepIndex,
  onStepChange,
  onSwitchFloor
}) {
  const [speaking, setSpeaking] = useState(false);

  if (!routeData) return null;

  const {
    source_name,
    source_floor,
    destination_name,
    destination_floor,
    distance,
    estimated_time,
    floors_crossed,
    instructions = [],
    route = [],
    path_nodes = []
  } = routeData;

  const currentStep = instructions[activeStepIndex] || instructions[0] || '';
  const isLastStep = activeStepIndex === instructions.length - 1;

  const handleNextStep = () => {
    if (activeStepIndex < instructions.length - 1) {
      const nextIdx = activeStepIndex + 1;
      onStepChange(nextIdx);

      // Check if this step changes floors and update map
      if (path_nodes[nextIdx]) {
        const nextNodeFloor = path_nodes[nextIdx].floor;
        if (onSwitchFloor) onSwitchFloor(nextNodeFloor);
      }

      if (nextIdx === instructions.length - 1) {
        // Trigger celebration confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const handlePrevStep = () => {
    if (activeStepIndex > 0) {
      const prevIdx = activeStepIndex - 1;
      onStepChange(prevIdx);
      if (path_nodes[prevIdx] && onSwitchFloor) {
        onSwitchFloor(path_nodes[prevIdx].floor);
      }
    }
  };

  const handleSpeakInstruction = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentStep);
      utterance.rate = 0.95;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Indoor Navigation Route',
        text: `Route from ${source_name} to ${destination_name} (${distance}m, ${estimated_time})`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Route link copied to clipboard!');
    }
  };

  return (
    <div className="nav-sidebar">
      {/* Route Endpoints Summary Header */}
      <div className="nav-sidebar-header">
        <div className="route-summary-card">
          <div className="route-endpoint">
            <div className="endpoint-icon" style={{ color: 'var(--success)' }}>
              <MapPin size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>FROM</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{source_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatFloor(source_floor)}</div>
            </div>
          </div>

          <div className="endpoint-divider"></div>

          <div className="route-endpoint">
            <div className="endpoint-icon" style={{ color: 'var(--danger)' }}>
              <MapPin size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>DESTINATION</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{destination_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatFloor(destination_floor)}</div>
            </div>
          </div>

          {/* Metrics bar */}
          <div className="route-metrics-bar">
            <div className="metric-item">
              <span className="metric-val">{distance} m</span>
              <span className="metric-lbl">Distance</span>
            </div>
            <div className="metric-item">
              <span className="metric-val">{estimated_time}</span>
              <span className="metric-lbl">Est. Time</span>
            </div>
            <div className="metric-item">
              <span className="metric-val">
                {source_floor === destination_floor ? 'Same Floor' : `${formatFloor(source_floor)} → ${formatFloor(destination_floor)}`}
              </span>
              <span className="metric-lbl">Floors</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {onReverseRoute && (
            <button
              onClick={onReverseRoute}
              className="btn btn-sm btn-secondary"
              style={{ flex: 1 }}
              title="Reverse Start and Destination"
            >
              <ArrowLeftRight size={14} />
              Reverse
            </button>
          )}
          <button
            onClick={handleShare}
            className="btn btn-sm btn-secondary"
            title="Share Route Link"
          >
            <Share2 size={14} />
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="btn btn-sm btn-secondary"
            >
              New Search
            </button>
          )}
        </div>

        {/* Live Active Step Banner */}
        <div
          style={{
            background: isLastStep ? 'var(--success-light)' : 'var(--primary-light)',
            border: `1.5px solid ${isLastStep ? 'var(--success)' : 'var(--primary)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isLastStep ? '#065f46' : 'var(--primary-dark)', textTransform: 'uppercase' }}>
              Step {activeStepIndex + 1} of {instructions.length}
            </span>
            <button
              onClick={handleSpeakInstruction}
              style={{ color: isLastStep ? '#065f46' : 'var(--primary-dark)', display: 'flex', alignItems: 'center' }}
              title="Audio Guidance"
            >
              <Volume2 size={16} />
            </button>
          </div>

          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: isLastStep ? '#064e3b' : 'var(--primary-dark)' }}>
            {currentStep}
          </div>

          {/* Stepper Navigation Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              onClick={handlePrevStep}
              disabled={activeStepIndex === 0}
              className="btn btn-sm btn-secondary"
              style={{ flex: 1, opacity: activeStepIndex === 0 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={handleNextStep}
              disabled={isLastStep}
              className={`btn btn-sm ${isLastStep ? 'btn-success' : 'btn-primary'}`}
              style={{ flex: 2 }}
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 size={14} /> Arrived!
                </>
              ) : (
                <>
                  Next Step <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full Turn-by-Turn Instruction List */}
      <div className="instructions-container">
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
          All Navigation Steps
        </h4>
        <div className="instruction-list">
          {instructions.map((inst, idx) => (
            <div
              key={idx}
              className={`instruction-item ${idx === activeStepIndex ? 'active' : ''}`}
              onClick={() => {
                onStepChange(idx);
                if (path_nodes[idx] && onSwitchFloor) {
                  onSwitchFloor(path_nodes[idx].floor);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="instruction-step-num">{idx + 1}</div>
              <div className="instruction-text">{inst}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
