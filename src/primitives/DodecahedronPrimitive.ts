import * as THREE from 'three';
import { BasePrimitive } from './BasePrimitive';
import { PhysicsObject, Collision } from '../types';
import { PRIMITIVE_CONFIGS } from '../constants/primitives';

export class DodecahedronPrimitive extends BasePrimitive {
  constructor(position: THREE.Vector3) {
    const config = PRIMITIVE_CONFIGS.dodecahedron;
    const geometry = new THREE.DodecahedronGeometry(config.radius!);
    super('dodecahedron', geometry, position, config.color);
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
    this.mesh.rotation.x += deltaTime * (2 + Math.sin(this.animationTime * 5));
    this.mesh.rotation.y += deltaTime * (1.5 + Math.cos(this.animationTime * 3));
    this.mesh.rotation.z += deltaTime * (3 + Math.sin(this.animationTime * 7));
    
    const scale = 1 + Math.sin(this.animationTime * 10) * 0.1;
    this.mesh.scale.setScalar(scale);
  }
}