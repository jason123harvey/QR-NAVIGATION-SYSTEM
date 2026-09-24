import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, RotateCcw, Trash2 } from 'lucide-react';
import { getSpeechRecognitionConstructor, isSpeechRecognitionSupported } from '../utils/speech';

export default function VoiceDestinationInput({ onTranscript, disabled = false }) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => () => {
    recognitionRef.current?.abort();
  }, []);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const startListening = () => {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setMessage('Voice recognition is not supported in this browser. Please type your destination.');
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      setListening(true);
      setMessage('Listening...');
    };
    recognition.onresult = (event) => {
      const value = event.results?.[0]?.[0]?.transcript?.trim() || '';
      if (!value) {
        setMessage('No speech detected. Please try again.');
        return;
      }
      setTranscript(value);
      setMessage('Voice destination recognized. Review the matches below.');
      onTranscript?.(value);
    };
    recognition.onerror = (event) => {
      const errorMessage = event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'Microphone permission is required for voice input.'
        : event.error === 'no-speech'
          ? 'No speech detected. Please try again.'
          : 'Voice recognition failed. Please try again or type your destination.';
      setMessage(errorMessage);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
      setMessage('Voice recognition could not start. Please try again.');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setMessage('');
    onTranscript?.('');
  };

  return (
    <div className="voice-destination-control" aria-live="polite">
      <div className="voice-destination-actions">
        <button
          type="button"
          className={`btn ${listening ? 'btn-danger-outline' : 'btn-outline-primary'} voice-mic-button`}
          onClick={listening ? stopListening : startListening}
          disabled={disabled}
          aria-label={listening ? 'Stop listening' : 'Speak destination'}
        >
          {listening ? <MicOff size={18} /> : <Mic size={18} />}
          <span>{listening ? 'Stop listening' : 'Speak destination'}</span>
        </button>
        <span className={`voice-status ${listening ? 'is-listening' : ''}`}>
          <span className="voice-status-dot" />
          {listening ? 'Listening' : 'Not listening'}
        </span>
      </div>
      {transcript && (
        <div className="voice-transcript-row">
          <span>Heard: “{transcript}”</span>
          <div className="voice-transcript-actions">
            <button type="button" onClick={startListening} title="Try voice input again" aria-label="Try voice input again">
              <RotateCcw size={15} />
            </button>
            <button type="button" onClick={clearTranscript} title="Clear voice transcript" aria-label="Clear voice transcript">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
      {message && <div className="voice-feedback">{message}</div>}
      {!isSpeechRecognitionSupported() && !message && (
        <div className="voice-feedback">Voice input is not supported in this browser. Please type your destination.</div>
      )}
    </div>
  );
}