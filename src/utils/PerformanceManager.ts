export class PerformanceManager {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private readonly targetFPS = 60;

  constructor() {
    this.lastTime = performance.now();
  }

  update(deltaTime: number): void {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    if (this.fps < 30) {
      this.optimizePerformance();
    }
  }

  private optimizePerformance(): void {
    console.log('Performance optimization triggered - FPS:', this.fps);
  }

  getFPS(): number {
    return this.fps;
  }

  shouldReduceQuality(): boolean {
    return this.fps < 30;
  }
}