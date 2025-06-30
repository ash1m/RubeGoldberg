import * as THREE from 'three';
import { PhysicsEngine } from '../core/Physics';
import { Collision, PrimitiveType } from '../types';
import { BasePrimitive } from '../primitives/BasePrimitive';
import { SpherePrimitive } from '../primitives/SpherePrimitive';
import { BoxPrimitive } from '../primitives/BoxPrimitive';
import { CylinderPrimitive } from '../primitives/CylinderPrimitive';
import { ConePrimitive } from '../primitives/ConePrimitive';
import { TorusPrimitive } from '../primitives/TorusPrimitive';
import { PlanePrimitive } from '../primitives/PlanePrimitive';
import { DodecahedronPrimitive } from '../primitives/DodecahedronPrimitive';
import { SIMULATION_CONSTANTS } from '../constants/physics';
import { Ball } from '../entities/Ball';

export class PrimitiveManager {
  private primitives: BasePrimitive[] = [];
  private scene: THREE.Scene;
  private physicsEngine: PhysicsEngine;
  private primitivePool: Map<PrimitiveType, BasePrimitive[]> = new Map();
  private lastSpawnPosition = new THREE.Vector3();

  private readonly primitiveTypes: PrimitiveType[] = [
    'sphere', 'box', 'cylinder', 'cone', 'torus', 'plane', 'dodecahedron'
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
    const primitiveMap = {
      sphere: () => new SpherePrimitive(position),
      box: () => new BoxPrimitive(position),
      cylinder: () => new CylinderPrimitive(position),
      cone: () => new ConePrimitive(position),
      torus: () => new TorusPrimitive(position),
      plane: () => new PlanePrimitive(position),
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

  update(ballPosition: THREE.Vector3, deltaTime: number): void {
    this.generatePrimitives(ballPosition);
    this.updatePrimitives(deltaTime);
    this.cleanupPrimitives(ballPosition);
  }

  private generatePrimitives(ballPosition: THREE.Vector3): void {
    if (this.primitives.length >= SIMULATION_CONSTANTS.MAX_PRIMITIVES) return;

    const spawnDistance = this.lastSpawnPosition.distanceTo(ballPosition);
    if (spawnDistance < SIMULATION_CONSTANTS.MIN_SPACING) return;

    const randomType = this.primitiveTypes[Math.floor(Math.random() * this.primitiveTypes.length)];
    const spawnPosition = new THREE.Vector3(
      ballPosition.x + (Math.random() - 0.5) * 20,
      ballPosition.y - Math.random() * 30 - 10,
      ballPosition.z + (Math.random() - 0.5) * 20
    );

    const tooClose = this.primitives.some(primitive => 
      primitive.position.distanceTo(spawnPosition) < SIMULATION_CONSTANTS.MIN_SPACING
    );

    if (!tooClose) {
      const primitive = this.getPooledPrimitive(randomType, spawnPosition);
      this.primitives.push(primitive);
      this.lastSpawnPosition.copy(spawnPosition);
    }
  }

  private updatePrimitives(deltaTime: number): void {
    this.primitives.forEach(primitive => {
      primitive.update(deltaTime);
    });
  }

  private cleanupPrimitives(ballPosition: THREE.Vector3): void {
    this.primitives = this.primitives.filter(primitive => {
      const distance = primitive.position.distanceTo(ballPosition);
      
      if (distance > SIMULATION_CONSTANTS.CLEANUP_RADIUS || primitive.shouldRemove) {
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