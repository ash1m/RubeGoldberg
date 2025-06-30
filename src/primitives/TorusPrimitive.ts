import * as THREE from 'three';
import { BasePrimitive } from './BasePrimitive';
import { PhysicsObject, Collision } from '../types';
import { PRIMITIVE_CONFIGS } from '../constants/primitives';

export class TorusPrimitive extends BasePrimitive {
  constructor(position: THREE.Vector3) {
    const config = PRIMITIVE_CONFIGS.torus;
    const geometry = new THREE.TorusGeometry(3, 1, 8, 16);
    super('torus', geometry, position, config.color);
    this.radius = config.radius;
    this.restitution = config.restitution;
  }

  checkCollision(ball: PhysicsObject): Collision | null {
    if (!ball.radius || !this.radius) return null;

    const distance = ball.position.distanceTo(this.position);
    const innerRadius = 2;
    const outerRadius = 4;

    if (distance > innerRadius - ball.radius && distance < outerRadius + ball.radius) {
      const normal = ball.position.clone().sub(this.position).normalize();
      const penetration = ball.radius - Math.abs(distance - (innerRadius + outerRadius) / 2);
      
      if (penetration > 0) {
        return {
          object: this,
          normal,
          penetration,
        };
      }
    }

    return null;
  }

  animate(deltaTime: number): void {
    const maxSwing = (Math.PI * 2) / 3;
    const swingAmount = Math.sin(this.animationTime * 1.5) * maxSwing;
    
    this.mesh.rotation.z = swingAmount;
    this.mesh.rotation.y += deltaTime * 2;
  }
}