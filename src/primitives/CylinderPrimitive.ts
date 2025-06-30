import * as THREE from 'three';
import { BasePrimitive } from './BasePrimitive';
import { PhysicsObject, Collision } from '../types';
import { PRIMITIVE_CONFIGS } from '../constants/primitives';

export class CylinderPrimitive extends BasePrimitive {
  constructor(position: THREE.Vector3) {
    const config = PRIMITIVE_CONFIGS.cylinder;
    const geometry = new THREE.CylinderGeometry(config.radius!, config.radius!, 6, 16);
    super('cylinder', geometry, position, config.color);
    this.radius = config.radius;
    this.restitution = config.restitution;
  }

  checkCollision(ball: PhysicsObject): Collision | null {
    if (!ball.radius || !this.radius) return null;

    const distance = ball.position.distanceTo(this.position);
    const minDistance = ball.radius + this.radius;

    if (distance < minDistance) {
      const normal = ball.position.clone().sub(this.position).normalize();
      const penetration = minDistance - distance;
      
      return {
        object: this,
        normal,
        penetration,
      };
    }

    return null;
  }

  animate(deltaTime: number): void {
    const maxRotation = Math.PI / 2;
    const rotationAmount = Math.sin(this.animationTime * 2) * maxRotation;
    this.mesh.rotation.x = rotationAmount;
    this.mesh.rotation.y += deltaTime * 4;
  }
}