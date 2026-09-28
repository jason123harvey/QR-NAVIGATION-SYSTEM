export class IndoorPositionProvider {
  constructor(name = 'IndoorPositionProvider') {
    this.name = name;
    this.listeners = new Set();
    this.isTracking = false;
  }

  getCurrentPosition() {
    return null;
  }

  startTracking() {
    this.isTracking = true;
    return this;
  }

  stopTracking() {
    this.isTracking = false;
    return this;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(position) {
    this.listeners.forEach((listener) => listener(position));
  }
}
