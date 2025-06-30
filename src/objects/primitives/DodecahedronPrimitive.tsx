import * as THREE from 'three';
import { Primitive } from './Primitive';
import { PhysicsObject, Collision } from '../../physics/PhysicsEngine';

export class DodecahedronPrimitive extends Primitive {
  constructor(position: THREE.Vector3) {
    const geometry = new THREE.DodecahedronGeometry(2.5);
    super('dodecahedron', geometry, position, 0xffffff);
    this.radius = 2.5;
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
    // Random rotation with multi-bounce surfaces
    this.mesh.rotation.x += deltaTime * (2 + Math.sin(this.animationTime * 5));
    this.mesh.rotation.y += deltaTime * (1.5 + Math.cos(this.animationTime * 3));
    this.mesh.rotation.z += deltaTime * (3 + Math.sin(this.animationTime * 7));
    
    // Scale pulsing for multi-bounce effect
    const scale = 1 + Math.sin(this.animationTime * 10) * 0.1;
    this.mesh.scale.setScalar(scale);
  }
}