import * as THREE from 'three';
import { PhysicsEngine } from '../core/Physics';
import { Collision, PrimitiveType } from '../types';
import { BasePrimitive } from '../primitives/BasePrimitive';
import { SpherePrimitive } from '../primitives/SpherePrimitive';
import { BoxPrimitive } from '../primitives/BoxPrimitive';
import { CylinderPrimitive } from '../primitives/CylinderPrimitive';
import { ConePrimitive } from '../primitives/ConePrimitive';
import { TorusPrimitive } from '../primitives/TorusPrimitive';
import { DodecahedronPrimitive } from '../primitives/DodecahedronPrimitive';
import { SIMULATION_CONSTANTS } from '../constants/physics';
import { Ball } from '../entities/Ball';

export class PrimitiveManager {
  private primitives: BasePrimitive[] = [];
  private scene: THREE.Scene;
  private physicsEngine: PhysicsEngine;
  private primitivePool: Map<PrimitiveType, BasePrimitive[]> = new Map();
  private lastSpawnPosition = new THREE.Vector3();
  private ballVelocityHistory: THREE.Vector3[] = [];

  // Removed 'plane' from the primitive types array
  private readonly primitiveTypes: PrimitiveType[] = [
    'sphere', 'box', 'cylinder', 'cone', 'torus', 'dodecahedron'
  ];

  constructor(scene: THREE.Scene, physicsEngine: PhysicsEngine) {
    this.scene = scene;
    this.physicsEngine = physicsEngine;
    this.initializePools();
  }

  private initializePools(): void {
    this.primitiveTypes.forEach(type => {
      this.primitivePool.set(type, []);
    });
  }

  private createPrimitive(type: PrimitiveType, position: THREE.Vector3): BasePrimitive {
    // Removed plane from the primitive creation map
    const primitiveMap = {
      sphere: () => new SpherePrimitive(position),
      box: () => new BoxPrimitive(position),
      cylinder: () => new CylinderPrimitive(position),
      cone: () => new ConePrimitive(position),
      torus: () => new TorusPrimitive(position),
      dodecahedron: () => new DodecahedronPrimitive(position)
    };

    const primitive = primitiveMap[type]();
    this.scene.add(primitive.mesh);
    return primitive;
  }

  private getPooledPrimitive(type: PrimitiveType, position: THREE.Vector3): BasePrimitive {
    const pool = this.primitivePool.get(type);
    if (pool && pool.length > 0) {
      const primitive = pool.pop()!;
      primitive.reset(position);
      this.scene.add(primitive.mesh);
      return primitive;
    }
    
    return this.createPrimitive(type, position);
  }

  private returnToPool(primitive: BasePrimitive): void {
    this.scene.remove(primitive.mesh);
    const pool = this.primitivePool.get(primitive.type);
    if (pool) {
      pool.push(primitive);
    }
  }

  private predictBallPath(ballPosition: THREE.Vector3, ballVelocity: THREE.Vector3): THREE.Vector3[] {
    const pathPoints: THREE.Vector3[] = [];
    const steps = 10; // Predict 10 steps ahead
    const timeStep = 0.5; // Half second per step
    
    let pos = ballPosition.clone();
    let vel = ballVelocity.clone();
    
    for (let i = 0; i < steps; i++) {
      // Simple physics prediction (gravity + current velocity)
      vel.y += -9.81 * timeStep; // Apply gravity
      pos.add(vel.clone().multiplyScalar(timeStep));
      pathPoints.push(pos.clone());
    }
    
    return pathPoints;
  }

  private isPositionNearPath(position: THREE.Vector3, pathPoints: THREE.Vector3[]): boolean {
    const maxDistance = 15; // Maximum distance from predicted path
    
    return pathPoints.some(pathPoint => 
      position.distanceTo(pathPoint) < maxDistance
    );
  }

  // PHYSICS UPDATE - Called with scaled time for slow motion
  updatePhysics(ballPosition: THREE.Vector3, deltaTime: number): void {
    // Track ball velocity history for better path prediction
    this.ballVelocityHistory.push(ballPosition.clone());
    if (this.ballVelocityHistory.length > 5) {
      this.ballVelocityHistory.shift();
    }

    this.generatePrimitives(ballPosition);
    this.cleanupPrimitives(ballPosition);
  }

  // VISUAL UPDATE - Always called with real-time delta for smooth visuals
  updateVisuals(realDeltaTime: number): void {
    this.primitives.forEach(primitive => {
      primitive.updateVisuals(realDeltaTime);
    });
  }

  // Legacy update method for backward compatibility - now calls both physics and visuals
  update(ballPosition: THREE.Vector3, deltaTime: number): void {
    this.updatePhysics(ballPosition, deltaTime);
    this.updateVisuals(deltaTime);
  }

  private generatePrimitives(ballPosition: THREE.Vector3): void {
    // Reduce max primitives for better performance and more targeted generation
    if (this.primitives.length >= 15) return;

    const spawnDistance = this.lastSpawnPosition.distanceTo(ballPosition);
    if (spawnDistance < SIMULATION_CONSTANTS.MIN_SPACING * 2) return;

    // Calculate ball velocity from history
    let ballVelocity = new THREE.Vector3();
    if (this.ballVelocityHistory.length >= 2) {
      const current = this.ballVelocityHistory[this.ballVelocityHistory.length - 1];
      const previous = this.ballVelocityHistory[this.ballVelocityHistory.length - 2];
      ballVelocity = current.clone().sub(previous);
    }

    // Predict ball path
    const pathPoints = this.predictBallPath(ballPosition, ballVelocity);

    const randomType = this.primitiveTypes[Math.floor(Math.random() * this.primitiveTypes.length)];
    
    // Generate position along predicted path with some randomness
    const pathIndex = Math.floor(Math.random() * Math.min(pathPoints.length, 5)); // Use first 5 path points
    const basePosition = pathPoints[pathIndex] || ballPosition;
    
    const spawnPosition = new THREE.Vector3(
      basePosition.x + (Math.random() - 0.5) * 12, // Reduced spread
      basePosition.y - Math.random() * 15 - 5, // Closer to predicted path
      basePosition.z + (Math.random() - 0.5) * 12  // Reduced spread
    );

    // Only spawn if position is near predicted path
    if (!this.isPositionNearPath(spawnPosition, pathPoints)) {
      return;
    }

    // Check spacing with existing primitives
    const tooClose = this.primitives.some(primitive => 
      primitive.position.distanceTo(spawnPosition) < SIMULATION_CONSTANTS.MIN_SPACING
    );

    if (!tooClose) {
      const primitive = this.getPooledPrimitive(randomType, spawnPosition);
      this.primitives.push(primitive);
      this.lastSpawnPosition.copy(spawnPosition);
    }
  }

  private cleanupPrimitives(ballPosition: THREE.Vector3): void {
    // Reduced cleanup radius for more focused primitive field
    const cleanupRadius = 80;
    
    this.primitives = this.primitives.filter(primitive => {
      const distance = primitive.position.distanceTo(ballPosition);
      
      if (distance > cleanupRadius || primitive.shouldRemove) {
        this.returnToPool(primitive);
        return false;
      }
      
      return true;
    });
  }

  checkCollisions(ball: Ball): Collision[] {
    const collisions: Collision[] = [];

    this.primitives.forEach(primitive => {
      const collision = primitive.checkCollision(ball);
      if (collision) {
        collision.primitive = primitive;
        collisions.push(collision);
      }
    });

    return collisions;
  }

  handleCollisions(collisions: Collision[]): void {
    collisions.forEach(collision => {
      if (collision.primitive) {
        collision.primitive.onCollision();
      }
    });
  }

  getActivePrimitiveCount(): number {
    return this.primitives.length;
  }

  getPrimitiveDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    this.primitives.forEach(primitive => {
      distribution[primitive.type] = (distribution[primitive.type] || 0) + 1;
    });

    return distribution;
  }
}