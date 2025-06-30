import { SimulationMetrics } from '../types';

export class MetricsManager {
  private frameCount = 0;
  private lastTime = performance.now();
  private collisionCount = 0;

  updateMetrics(
    ballVelocity: number,
    activePrimitives: number,
    primitiveDistribution: Record<string, number>,
    newCollisions: number
  ): SimulationMetrics {
    this.collisionCount += newCollisions;
    this.frameCount++;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    const fps = Math.round(1 / deltaTime);
    this.lastTime = currentTime;

    return {
      ballVelocity: parseFloat(ballVelocity.toFixed(2)),
      activePrimitives,
      collisionCount: this.collisionCount,
      fps,
      primitiveDistribution
    };
  }

  reset(): void {
    this.frameCount = 0;
    this.collisionCount = 0;
    this.lastTime = performance.now();
  }
}