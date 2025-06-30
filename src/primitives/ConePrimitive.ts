import * as THREE from 'three';
import { BasePrimitive } from './BasePrimitive';
import { PhysicsObject, Collision } from '../types';
import { PRIMITIVE_CONFIGS } from '../constants/primitives';

export class ConePrimitive extends BasePrimitive {
  constructor(position: THREE.Vector3) {
    const config = PRIMITIVE_CONFIGS.cone;
    const geometry = new THREE.ConeGeometry(config.radius!, 4, 16);
    super('cone', geometry, position, config.color);
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
    const maxTip = Math.PI / 3;
    const tipAmount = Math.sin(this.animationTime * 4) * maxTip;
    
    this.mesh.rotation.x = tipAmount;
    this.mesh.rotation.z = tipAmount * 0.5;
    
    const wobble = Math.sin(this.animationTime * 8) * 0.1;
    this.mesh.position.y = this.originalPosition.y + wobble;
  }
}