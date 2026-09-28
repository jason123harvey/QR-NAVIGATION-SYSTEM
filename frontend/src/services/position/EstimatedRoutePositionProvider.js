import { IndoorPositionProvider } from './IndoorPositionProvider';

export class EstimatedRoutePositionProvider extends IndoorPositionProvider {
  constructor(route = [], start = null) {
    super('EstimatedRoutePositionProvider');
    this.route = route;
    this.start = start;
    this.currentIndex = 0;
  }

  setRoute(route = [], start = null) {
    this.route = route;
    this.start = start;
    this.currentIndex = 0;
    this.notify(this.getCurrentPosition());
  }

  setCurrentIndex(index) {
    this.currentIndex = Math.max(0, index);
    this.notify(this.getCurrentPosition());
  }

  getCurrentPosition() {
    if (!this.route || this.route.length === 0) return null;
    const clampedIndex = Math.min(this.currentIndex, this.route.length - 1);
    const targetNode = this.route[clampedIndex];
    if (!targetNode) return null;
    return {
      ...targetNode,
      source: 'Route Estimate',
      confidence: 'estimated',
      status: 'Estimated',
      estimated: true,
      floor: targetNode.floor,
      location_code: targetNode.location_code,
      name: targetNode.name,
    };
  }
}
