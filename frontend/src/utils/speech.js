export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return Boolean(getSpeechRecognitionConstructor());
}

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';
}

const NUMBER_WORDS = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
};

export function normalizeSpokenDestination(value = '') {
  let normalized = value.toLowerCase().trim();
  Object.entries(NUMBER_WORDS).forEach(([word, number]) => {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), number);
  });

  normalized = normalized
    .replace(/\b(take me to|i want to go to|navigate to|go to|please take me to|please navigate to|where is|find|show me)\b/g, ' ')
    .replace(/\b(the|a|an|please)\b/g, ' ')
    .replace(/\b(first|1st) floor\b/g, ' ')
    .replace(/\b(second|2nd) floor\b/g, ' ')
    .replace(/\b(ground|g) floor\b/g, ' ')
    .replace(/\b(computer science laboratory|computer science lab)\b/g, 'cse lab')
    .replace(/\b(computer laboratory|computer lab)\b/g, 'cse lab')
    .replace(/\bcse\s+laboratory\b/g, 'cse lab')
    .replace(/\bece\s+laboratory\b/g, 'ece lab')
    .replace(/[^a-z0-9_\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

function searchableLocationText(location) {
  return [location.name, location.location_code, location.description, location.building]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, ' ');
}

export function findDestinationMatches(spokenText, locations = [], currentLocation = null) {
  const query = normalizeSpokenDestination(spokenText);
  if (!query) return [];

  const queryTokens = query.split(' ').filter(Boolean);
  return locations
    .filter((location) => !currentLocation || location.location_code !== currentLocation.location_code)
    .map((location) => {
      const searchableText = searchableLocationText(location);
      const normalizedCode = location.location_code.toLowerCase().replace(/_/g, ' ');
      const exactName = location.name.toLowerCase() === query;
      const exactCode = normalizedCode === query || location.location_code.toLowerCase() === query.replace(/ /g, '_');
      const tokenMatches = queryTokens.filter((token) => searchableText.includes(token)).length;
      const score = (exactName ? 100 : 0) + (exactCode ? 90 : 0) + tokenMatches * 10 + (searchableText.includes(query) ? 30 : 0);
      return { location, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ location }) => location);
}

export function speakText(text, options = {}) {
  if (!isSpeechSynthesisSupported() || !text) return false;
  const utterance = new window.SpeechSynthesisUtterance(text);
  Object.assign(utterance, options);
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}