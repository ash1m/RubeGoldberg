import * as THREE from 'three';
import { Primitive } from './Primitive';
import { PhysicsObject, Collision } from '../../physics/PhysicsEngine';

export class CylinderPrimitive extends Primitive {
  constructor(position: THREE.Vector3) {
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 6, 16);
    super('cylinder', geometry, position, 0x4444ff);
    this.radius = 1.5;
  }

  checkCollision(ball: PhysicsObject): Collision | null {
    if (!ball.radius || !this.radius) return null;

    // Simplified cylinder collision (treat as sphere for now)
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

  animate(deltaTime: number) {
    // Rotational axis movement (90° range)
    const maxRotation = Math.PI / 2; // 90 degrees
    const rotationAmount = Math.sin(this.animationTime * 2) * maxRotation;
    this.mesh.rotation.x = rotationAmount;
    
    // Spin around Y axis
    this.mesh.rotation.y += deltaTime * 4;
  }
}