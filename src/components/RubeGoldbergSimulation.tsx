import React, { useRef, useEffect, useState } from 'react';
import { SceneManager } from '../core/Scene';
import { PhysicsEngine } from '../core/Physics';
import { Ball } from '../entities/Ball';
import { PrimitiveManager } from '../managers/PrimitiveManager';
import { MetricsManager } from '../managers/MetricsManager';
import { PerformanceManager } from '../utils/PerformanceManager';
import { UI } from './UI';
import { SimulationMetrics } from '../types';

const RubeGoldbergSimulation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    ballVelocity: 0,
    activePrimitives: 0,
    collisionCount: 0,
    fps: 0,
    primitiveDistribution: {}
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize core systems
    const sceneManager = new SceneManager(mountRef.current);
    const physicsEngine = new PhysicsEngine();
    const performanceManager = new PerformanceManager();
    const metricsManager = new MetricsManager();

    // Initialize entities
    const ball = new Ball(sceneManager.scene);
    const primitiveManager = new PrimitiveManager(sceneManager.scene, physicsEngine);

    let frameCount = 0;
    let lastTime = performance.now();

    // Animation loop
    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Update ball
      ball.update(deltaTime);

      // Update primitives
      primitiveManager.update(ball.position, deltaTime);

      // Check collisions
      const collisions = primitiveManager.checkCollisions(ball);
      if (collisions.length > 0) {
        ball.handleCollisions(collisions);
        primitiveManager.handleCollisions(collisions);
      }

      // Update camera
      sceneManager.updateCamera(ball.position);

      // Update metrics every 10 frames
      frameCount++;
      if (frameCount % 10 === 0) {
        const updatedMetrics = metricsManager.updateMetrics(
          ball.velocity.length(),
          primitiveManager.getActivePrimitiveCount(),
          primitiveManager.getPrimitiveDistribution(),
          collisions.length
        );
        setMetrics(updatedMetrics);
      }

      // Performance monitoring
      performanceManager.update(deltaTime);

      // Render
      sceneManager.render();
      requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      sceneManager.handleResize();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && sceneManager.renderer.domElement) {
        mountRef.current.removeChild(sceneManager.renderer.domElement);
      }
      sceneManager.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      <UI metrics={metrics} />
    </div>
  );
};

export default RubeGoldbergSimulation;