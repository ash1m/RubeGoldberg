import * as THREE from 'three';
import { PhysicsEngine, Collision, PhysicsObject } from '../physics/PhysicsEngine';
import { Primitive, PrimitiveType } from './primitives/Primitive';
import { SpherePrimitive } from './primitives/SpherePrimitive';
import { BoxPrimitive } from './primitives/BoxPrimitive';
import { CylinderPrimitive } from './primitives/CylinderPrimitive';
import { ConePrimitive } from './primitives/ConePrimitive';
import { TorusPrimitive } from './primitives/TorusPrimitive';
import { PlanePrimitive } from './primitives/PlanePrimitive';
import { DodecahedronPrimitive } from './primitives/DodecahedronPrimitive';

export class PrimitiveManager {
  private primitives: Primitive[] = [];
  private scene: THREE.Scene;
  private physicsEngine: PhysicsEngine;
  private primitivePool: Map<PrimitiveType, Primitive[]> = new Map();
  private lastSpawnPosition = new THREE.Vector3();
  private minSpacing = 5;
  private maxPrimitives = 50;
  private spawnRadius = 100;
  private cleanupRadius = 150;

  constructor(scene: THREE.Scene, physicsEngine: PhysicsEngine) {
    this.scene = scene;
    this.physicsEngine = physicsEngine;
    this.initializePools();
  }

  private initializePools() {
    const types: PrimitiveType[] = ['sphere', 'box', 'cylinder', 'cone', 'torus', 'plane', 'dodecahedron'];
    
    types.forEach(type => {
      this.primitivePool.set(type, []);
    });
  }

  private createPrimitive(type: PrimitiveType, position: THREE.Vector3): Primitive {
    let primitive: Primitive;

    switch (type) {
      case 'sphere':
        primitive = new SpherePrimitive(position);
        break;
      case 'box':
        primitive = new BoxPrimitive(position);
        break;
      case 'cylinder':
        primitive = new CylinderPrimitive(position);
        break;
      case 'cone':
        primitive = new ConePrimitive(position);
        break;
      case 'torus':
        primitive = new TorusPrimitive(position);
        break;
      case 'plane':
        primitive = new PlanePrimitive(position);
        break;
      case 'dodecahedron':
        primitive = new DodecahedronPrimitive(position);
        break;
    }

    this.scene.add(primitive.mesh);
    return primitive;
  }

  private getPooledPrimitive(type: PrimitiveType, position: THREE.Vector3): Primitive {
    const pool = this.primitivePool.get(type);
    if (pool && pool.length > 0) {
      const primitive = pool.pop()!;
      primitive.reset(position);
      this.scene.add(primitive.mesh);
      return primitive;
    }
    
    return this.createPrimitive(type, position);
  }

  private returnToPool(primitive: Primitive) {
    this.scene.remove(primitive.mesh);
    const pool = this.primitivePool.get(primitive.type);
    if (pool) {
      pool.push(primitive);
    }
  }

  update(ballPosition: THREE.Vector3, deltaTime: number) {
    // Generate new primitives
    this.generatePrimitives(ballPosition);

    // Update existing primitives
    this.primitives.forEach(primitive => {
      primitive.update(deltaTime);
    });

    // Clean up distant primitives
    this.cleanupPrimitives(ballPosition);
  }

  private generatePrimitives(ballPosition: THREE.Vector3) {
    if (this.primitives.length >= this.maxPrimitives) return;

    // Generate in the ball's descent path
    const spawnDistance = this.lastSpawnPosition.distanceTo(ballPosition);
    
    if (spawnDistance < this.minSpacing) return;

    const types: PrimitiveType[] = ['sphere', 'box', 'cylinder', 'cone', 'torus', 'plane', 'dodecahedron'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    // Generate position below the ball
    const spawnPosition = new THREE.Vector3(
      ballPosition.x + (Math.random() - 0.5) * 20,
      ballPosition.y - Math.random() * 30 - 10,
      ballPosition.z + (Math.random() - 0.5) * 20
    );

    // Check spacing with existing primitives
    const tooClose = this.primitives.some(primitive => 
      primitive.position.distanceTo(spawnPosition) < this.minSpacing
    );

    if (!tooClose) {
      const primitive = this.getPooledPrimitive(randomType, spawnPosition);
      this.primitives.push(primitive);
      this.lastSpawnPosition.copy(spawnPosition);
    }
  }

  private cleanupPrimitives(ballPosition: THREE.Vector3) {
    const activeDistance = this.cleanupRadius;
    
    this.primitives = this.primitives.filter(primitive => {
      const distance = primitive.position.distanceTo(ballPosition);
      
      if (distance > activeDistance || primitive.shouldRemove) {
        this.returnToPool(primitive);
        return false;
      }
      
      return true;
    });
  }

  checkCollisions(ball: PhysicsObject): Collision[] {
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

  handleCollisions(collisions: Collision[]) {
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