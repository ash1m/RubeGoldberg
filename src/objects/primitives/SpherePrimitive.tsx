import * as THREE from 'three';
import { Primitive } from './Primitive';
import { PhysicsObject, Collision } from '../../physics/PhysicsEngine';

export class SpherePrimitive extends Primitive {
  constructor(position: THREE.Vector3) {
    const geometry = new THREE.SphereGeometry(2, 16, 16);
    super('sphere', geometry, position, 0xff4444);
    this.radius = 2;
    this.restitution = 0.8;
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

  animate(deltaTime: number) {
    // Elastic bounce animation
    const bounceScale = 1 + Math.sin(this.animationTime * 8) * 0.2;
    this.mesh.scale.setScalar(bounceScale);
    
    // Spin animation
    this.mesh.rotation.x += deltaTime * 2;
    this.mesh.rotation.y += deltaTime * 3;
  }
}