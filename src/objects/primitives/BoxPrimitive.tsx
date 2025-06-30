import * as THREE from 'three';
import { Primitive } from './Primitive';
import { PhysicsObject, Collision } from '../../physics/PhysicsEngine';

export class BoxPrimitive extends Primitive {
  constructor(position: THREE.Vector3) {
    const geometry = new THREE.BoxGeometry(4, 1, 4);
    super('box', geometry, position, 0x44ff44);
    this.updateBoundingBox();
  }

  private updateBoundingBox() {
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
        normal.set(0, 1, 0); // Default upward normal
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

  animate(deltaTime: number) {
    // Platform rotation animation (45° range)
    const maxRotation = Math.PI / 4; // 45 degrees
    const rotationAmount = Math.sin(this.animationTime * 3) * maxRotation;
    this.mesh.rotation.z = rotationAmount;
    
    // Update bounding box with rotation
    this.updateBoundingBox();
  }
}