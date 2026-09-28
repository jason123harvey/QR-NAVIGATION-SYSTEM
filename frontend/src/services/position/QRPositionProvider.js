import { IndoorPositionProvider } from './IndoorPositionProvider';

export class QRPositionProvider extends IndoorPositionProvider {
  constructor(currentLocation = null) {
    super('QRPositionProvider');
    this.currentLocation = currentLocation;
  }

  getCurrentPosition() {
    return this.currentLocation ? {
      ...this.currentLocation,
      source: 'QR',
      confidence: 'verified',
      status: 'QR Verified'
    } : null;
  }

  startTracking() {
    super.startTracking();
    this.notify(this.getCurrentPosition());
    return this;
  }

  updateCurrentLocation(location) {
    this.currentLocation = location;
    this.notify(this.getCurrentPosition());
    return this;
  }
}
