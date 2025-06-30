import * as THREE from 'three';
import { BasePrimitive } from './BasePrimitive';
import { PhysicsObject, Collision } from '../types';
import { PRIMITIVE_CONFIGS } from '../constants/primitives';

export class PlanePrimitive extends BasePrimitive {
  constructor(position: THREE.Vector3) {
    const config = PRIMITIVE_CONFIGS.plane;
    const geometry = new THREE.PlaneGeometry(8, 8);
    super('plane', geometry, position, config.color);
    this.mesh.rotation.x = -Math.PI / 2;
    this.restitution = config.restitution;
    this.updateBoundingBox();
  }

  private updateBoundingBox(): void {
    this.mesh.geometry.computeBoundingBox();
    if (this.mesh.geometry.boundingBox) {
      this.boundingBox = this.mesh.geometry.boundingBox.clone();
      this.boundingBox.translate(this.position);
    }
  }

  checkCollision(ball: PhysicsObject): Collision | null {
    if (!ball.radius) return null;

    const localPosition = ball.position.clone().sub(this.position);
    const distance = Math.abs(localPosition.y);

    if (distance < ball.radius && 
        Math.abs(localPosition.x) < 4 && 
        Math.abs(localPosition.z) < 4) {
      
      const normal = new THREE.Vector3(0, localPosition.y > 0 ? 1 : -1, 0);
      const penetration = ball.radius - distance;
      
      return {
        object: this,
        normal,
        penetration,
      };
    }

    return null;
  }

  animate(deltaTime: number): void {
    const maxTilt = Math.PI / 6;
    const tiltX = Math.sin(this.animationTime * 3) * maxTilt;
    const tiltZ = Math.cos(this.animationTime * 2) * maxTilt;
    
    this.mesh.rotation.x = -Math.PI / 2 + tiltX;
    this.mesh.rotation.z = tiltZ;
    
    this.updateBoundingBox();
  }
}