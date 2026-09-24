import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowRight, ArrowLeftRight, Clock, Footprints, Layers, 
  CheckCircle2, Volume2, VolumeX, ChevronRight, ChevronLeft, Sparkles, Share2, MapPin,
  Mic, Pause, Play, Square, RotateCcw, Accessibility
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatFloor } from './LocationCard';
import { getSpeechRecognitionConstructor, isSpeechSynthesisSupported, speakText, stopSpeaking } from '../utils/speech';

export default function NavigationPanel({ 
  routeData, 
  onReverseRoute, 
  onReset,
  activeStepIndex,
  onStepChange,
  onSwitchFloor
  , currentLocation
}) {
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

  const [voiceEnabled, setVoiceEnabled] = useState(isSpeechSynthesisSupported());
  const [voiceRunning, setVoiceRunning] = useState(isSpeechSynthesisSupported());
  const [speaking, setSpeaking] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [destinationReached, setDestinationReached] = useState(false);
  const [voiceRate, setVoiceRate] = useState(0.95);
  const [voicePitch, setVoicePitch] = useState(1);
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [voiceName, setVoiceName] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [commandListening, setCommandListening] = useState(false);
  const commandRecognitionRef = useRef(null);
  const initialRouteRef = useRef(null);

  useEffect(() => {
    if (!isSpeechSynthesisSupported()) return undefined;
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const getVoiceOptions = () => ({
    rate: voiceRate,
    pitch: voicePitch,
    volume: voiceVolume,
    voice: availableVoices.find((voice) => voice.name === voiceName),
  });

  const speakInstruction = (index = activeStepIndex, advance = true) => {
    if (!voiceEnabled || !isSpeechSynthesisSupported() || !instructions[index]) return;
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(instructions[index]);
    Object.assign(utterance, getVoiceOptions());
    setSpeaking(true);
    setVoiceMessage('Speaking current instruction');
    utterance.onend = () => {
      setSpeaking(false);
      if (advance && voiceRunning && index < instructions.length - 1) {
        onStepChange(index + 1);
      } else if (advance && voiceRunning && index === instructions.length - 1) {
        speakText(`You have reached ${destination_name}.`, getVoiceOptions());
        setDestinationReached(true);
        setVoiceMessage('Destination reached');
      }
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setVoiceMessage('Voice output is unavailable. Text directions remain available.');
    };
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (initialRouteRef.current === routeData) return;
    initialRouteRef.current = routeData;
    if (voiceEnabled) speakInstruction(0);
    return () => stopSpeaking();
  }, [routeData]);

  useEffect(() => {
    if (voiceEnabled && voiceRunning && activeStepIndex > 0) speakInstruction(activeStepIndex);
  }, [activeStepIndex]);

  const handleRepeat = () => speakInstruction(activeStepIndex, false);

  const handlePause = () => {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.pause();
      setVoiceMessage('Voice navigation paused');
    }
  };

  const handleResume = () => {
    if (isSpeechSynthesisSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setVoiceMessage('Voice navigation resumed');
    } else {
      setVoiceRunning(true);
      speakInstruction(activeStepIndex);
    }
  };

  const handleStop = () => {
    stopSpeaking();
    setVoiceRunning(false);
    setSpeaking(false);
    setVoiceMessage('Voice navigation stopped. The route remains visible.');
  };

  const speakWhereAmI = () => {
    const location = currentLocation || { name: source_name, floor: source_floor };
    const message = `You are currently at ${location.name} on the ${formatFloor(location.floor).toLowerCase()}.`;
    setVoiceMessage(message);
    speakText(message, getVoiceOptions());
  };

  const speakHowFar = () => {
    const message = `You have approximately ${distance} meters on this route to ${destination_name}.`;
    setVoiceMessage(message);
    speakText(message, getVoiceOptions());
  };

  const handleCommand = (command) => {
    const normalized = command.toLowerCase();
    if (normalized.includes('repeat')) handleRepeat();
    else if (normalized.includes('where am i')) speakWhereAmI();
    else if (normalized.includes('how far')) speakHowFar();
    else if (normalized.includes('pause')) handlePause();
    else if (normalized.includes('resume')) handleResume();
    else if (normalized.includes('stop')) handleStop();
    else if (normalized.includes('next')) onStepChange(Math.min(activeStepIndex + 1, instructions.length - 1));
    else setVoiceMessage('Command not recognized. Try repeat, where am I, how far, pause, resume, or stop.');
  };

  const listenForCommand = () => {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setVoiceMessage('Voice commands are not supported in this browser.');
      return;
    }
    commandRecognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      setCommandListening(true);
      setVoiceMessage('Listening for a navigation command');
    };
    recognition.onresult = (event) => handleCommand(event.results?.[0]?.[0]?.transcript || '');
    recognition.onerror = () => setVoiceMessage('No command detected. Please try again.');
    recognition.onend = () => setCommandListening(false);
    commandRecognitionRef.current = recognition;
    recognition.start();
  };

  const handleVoiceToggle = (enabled) => {
    setVoiceEnabled(enabled);
    setVoiceRunning(enabled);
    if (!enabled) stopSpeaking();
    else speakInstruction(activeStepIndex);
  };

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
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </div>

          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: isLastStep ? '#064e3b' : 'var(--primary-dark)' }}>
            {currentStep}
          </div>

          {destinationReached && (
            <div className="destination-reached-banner" role="status">
              <CheckCircle2 size={18} />
              <span>Destination Reached: {destination_name}</span>
            </div>
          )}

          <div className="voice-navigation-controls">
            <div className="voice-navigation-status">
              <span>{voiceEnabled ? (speaking ? 'Voice Navigation: Speaking' : 'Voice Navigation: On') : 'Voice Navigation: Text only'}</span>
              {voiceMessage && <small>{voiceMessage}</small>}
            </div>
            <div className="voice-control-actions">
              <button type="button" className="btn btn-sm btn-secondary" onClick={handleRepeat} disabled={!voiceEnabled} title="Repeat current instruction">
                <RotateCcw size={14} /> Repeat
              </button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={handlePause} disabled={!voiceEnabled} title="Pause voice navigation">
                <Pause size={14} /> Pause
              </button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={handleResume} disabled={!voiceEnabled} title="Resume voice navigation">
                <Play size={14} /> Resume
              </button>
              <button type="button" className="btn btn-sm btn-danger-outline" onClick={handleStop} disabled={!voiceEnabled} title="Stop voice navigation">
                <Square size={14} /> Stop
              </button>
            </div>
            <div className="voice-control-actions">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={listenForCommand} disabled={commandListening}>
                <Mic size={14} /> {commandListening ? 'Listening...' : 'Voice command'}
              </button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={speakWhereAmI}>
                <MapPin size={14} /> Where am I?
              </button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={speakHowFar}>
                <Footprints size={14} /> How far?
              </button>
            </div>
            <div className="voice-settings">
              <label>Voice <input type="checkbox" checked={voiceEnabled} onChange={(event) => handleVoiceToggle(event.target.checked)} /></label>
              <label>Rate <input type="range" min="0.8" max="1.2" step="0.05" value={voiceRate} onChange={(event) => setVoiceRate(Number(event.target.value))} /></label>
              <label>Pitch <input type="range" min="0.8" max="1.2" step="0.05" value={voicePitch} onChange={(event) => setVoicePitch(Number(event.target.value))} /></label>
              <label>Volume <input type="range" min="0" max="1" step="0.1" value={voiceVolume} onChange={(event) => setVoiceVolume(Number(event.target.value))} /></label>
              {availableVoices.length > 1 && (
                <label>Language / voice
                  <select value={voiceName} onChange={(event) => setVoiceName(event.target.value)}>
                    <option value="">Default English voice</option>
                    {availableVoices.map((voice) => <option key={voice.voiceURI} value={voice.name}>{voice.name}</option>)}
                  </select>
                </label>
              )}
            </div>
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
