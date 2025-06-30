import React, { useRef, useEffect, useState } from 'react';
import { SceneManager } from '../core/Scene';
import { PhysicsEngine } from '../core/Physics';
import { Ball } from '../entities/Ball';
import { PrimitiveManager } from '../managers/PrimitiveManager';
import { MetricsManager } from '../managers/MetricsManager';
import { PerformanceManager } from '../utils/PerformanceManager';
import { SpaceParticles } from '../effects/SpaceParticles';
import { UI } from './UI';
import { SimulationMetrics } from '../types';

const RubeGoldbergSimulation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    ballVelocity: 0,
    activePrimitives: 0,
    collisionCount: 0,
    fps: 0,
    primitiveDistribution: {},
    kineticEnergy: 0,
    potentialEnergy: 0,
    totalEnergy: 0
  });
  
  // Time scale state for slow motion control (1.0 = normal speed, 0.1 = 10% speed)
  const [timeScale, setTimeScale] = useState<number>(1.0);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize core systems
    const sceneManager = new SceneManager(mountRef.current);
    const physicsEngine = new PhysicsEngine();
    const performanceManager = new PerformanceManager();
    const metricsManager = new MetricsManager();

    // Initialize space particles effect
    const spaceParticles = new SpaceParticles(sceneManager.scene, sceneManager.camera);

    // Initialize entities
    const ball = new Ball(sceneManager.scene);
    const primitiveManager = new PrimitiveManager(sceneManager.scene, physicsEngine);

    let frameCount = 0;
    let lastTime = performance.now();
    let accumulatedTime = 0;
    const fixedTimeStep = 1 / 60; // 60 FPS physics

    // Animation loop with fixed timestep physics and time scaling
    const animate = () => {
      const currentTime = performance.now();
      let deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap delta time
      lastTime = currentTime;
      
      // Apply time scale to delta time for slow motion effect
      deltaTime *= timeScale;
      accumulatedTime += deltaTime;

      // Fixed timestep physics updates with time scaling
      while (accumulatedTime >= fixedTimeStep) {
        // Apply forces and integrate physics with scaled time
        physicsEngine.integrateForces(ball, ball.id, fixedTimeStep);
        
        // Update ball position
        physicsEngine.updatePosition(ball, fixedTimeStep);

        // Update primitives
        primitiveManager.update(ball.position, fixedTimeStep);

        // Check collisions
        const collisions = primitiveManager.checkCollisions(ball);
        if (collisions.length > 0) {
          // Resolve collisions with proper physics
          collisions.forEach(collision => {
            physicsEngine.resolveCollision(ball, collision, ball.id);
          });
          
          ball.handleCollisions(collisions);
          primitiveManager.handleCollisions(collisions);
        }

        // Occasionally add random forces to maintain interesting motion
        if (Math.random() < 0.001) { // 0.1% chance per frame
          physicsEngine.addRandomForce(ball.id, 2);
        }

        accumulatedTime -= fixedTimeStep;
      }

      // Update visual components with interpolation and time scaling
      const alpha = accumulatedTime / fixedTimeStep;
      ball.update(deltaTime);

      // Update space particles with parallax effect (use original deltaTime for smooth visuals)
      spaceParticles.update((currentTime - lastTime) / 1000);

      // Update camera
      sceneManager.updateCamera(ball.position);

      // Update metrics every 10 frames
      frameCount++;
      if (frameCount % 10 === 0) {
        const updatedMetrics = metricsManager.updateMetrics(
          ball.velocity.length(),
          primitiveManager.getActivePrimitiveCount(),
          primitiveManager.getPrimitiveDistribution(),
          0, // Collision count handled separately
          ball.getKineticEnergy(),
          ball.getPotentialEnergy(),
          ball.getTotalEnergy()
        );
        setMetrics(updatedMetrics);
      }

      // Performance monitoring (use original deltaTime)
      performanceManager.update((currentTime - lastTime) / 1000);

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
      physicsEngine.clearForces(ball.id);
      spaceParticles.dispose();
      if (mountRef.current && sceneManager.renderer.domElement) {
        mountRef.current.removeChild(sceneManager.renderer.domElement);
      }
      sceneManager.dispose();
    };
  }, [timeScale]); // Re-run effect when timeScale changes

  const handleTimeScaleChange = (newTimeScale: number) => {
    setTimeScale(newTimeScale);
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      <UI 
        metrics={metrics} 
        timeScale={timeScale}
        onTimeScaleChange={handleTimeScaleChange}
      />
    </div>
  );
};

export default RubeGoldbergSimulation;