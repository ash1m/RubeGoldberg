import * as THREE from 'three';
import { BasePrimitive } from './BasePrimitive';
import { PhysicsObject, Collision } from '../types';
import { PRIMITIVE_CONFIGS } from '../constants/primitives';

export class SpherePrimitive extends BasePrimitive {
  constructor(position: THREE.Vector3) {
    const config = PRIMITIVE_CONFIGS.sphere;
    const geometry = new THREE.SphereGeometry(config.radius!, 16, 16);
    super('sphere', geometry, position, config.color);
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
    const bounceScale = 1 + Math.sin(this.animationTime * 8) * 0.2;
    this.mesh.scale.setScalar(bounceScale);
    
    this.mesh.rotation.x += deltaTime * 2;
    this.mesh.rotation.y += deltaTime * 3;
  }
}