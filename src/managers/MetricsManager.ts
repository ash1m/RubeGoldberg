import { SimulationMetrics } from '../types';

export class MetricsManager {
  private frameCount = 0;
  private lastTime = performance.now();
  private collisionCount = 0;
  private energyHistory: number[] = [];

  updateMetrics(
    ballVelocity: number,
    activePrimitives: number,
    primitiveDistribution: Record<string, number>,
    newCollisions: number,
    kineticEnergy: number,
    potentialEnergy: number,
    totalEnergy: number
  ): SimulationMetrics {
    this.collisionCount += newCollisions;
    this.frameCount++;

    // Track energy over time
    this.energyHistory.push(totalEnergy);
    if (this.energyHistory.length > 100) {
      this.energyHistory.shift();
    }

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    const fps = Math.round(1 / deltaTime);
    this.lastTime = currentTime;

    return {
      ballVelocity: parseFloat(ballVelocity.toFixed(2)),
      activePrimitives,
      collisionCount: this.collisionCount,
      fps,
      primitiveDistribution,
      kineticEnergy: parseFloat(kineticEnergy.toFixed(2)),
      potentialEnergy: parseFloat(potentialEnergy.toFixed(2)),
      totalEnergy: parseFloat(totalEnergy.toFixed(2))
    };
  }

  getEnergyTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.energyHistory.length < 10) return 'stable';
    
    const recent = this.energyHistory.slice(-10);
    const older = this.energyHistory.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const threshold = 0.1;
    if (recentAvg > olderAvg + threshold) return 'increasing';
    if (recentAvg < olderAvg - threshold) return 'decreasing';
    return 'stable';
  }

  reset(): void {
    this.frameCount = 0;
    this.collisionCount = 0;
    this.energyHistory = [];
    this.lastTime = performance.now();
  }
}