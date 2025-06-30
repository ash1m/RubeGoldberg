import * as THREE from 'three';
import { BasePrimitive } from './BasePrimitive';
import { PhysicsObject, Collision } from '../types';
import { PRIMITIVE_CONFIGS } from '../constants/primitives';

export class BoxPrimitive extends BasePrimitive {
  constructor(position: THREE.Vector3) {
    const config = PRIMITIVE_CONFIGS.box;
    const geometry = new THREE.BoxGeometry(4, 1, 4);
    super('box', geometry, position, config.color);
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
    if (!ball.radius || !this.boundingBox) return null;

    const closestPoint = new THREE.Vector3();
    this.boundingBox.clampPoint(ball.position, closestPoint);
    
    const distance = ball.position.distanceTo(closestPoint);
    
    if (distance < ball.radius) {
      const normal = ball.position.clone().sub(closestPoint).normalize();
      if (normal.length() === 0) {
        normal.set(0, 1, 0);
      }
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
    const maxRotation = Math.PI / 4;
    const rotationAmount = Math.sin(this.animationTime * 3) * maxRotation;
    this.mesh.rotation.z = rotationAmount;
    this.updateBoundingBox();
  }
}