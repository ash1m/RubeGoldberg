import * as THREE from 'three';
import { Primitive } from './Primitive';
import { PhysicsObject, Collision } from '../../physics/PhysicsEngine';

export class PlanePrimitive extends Primitive {
  constructor(position: THREE.Vector3) {
    const geometry = new THREE.PlaneGeometry(8, 8);
    super('plane', geometry, position, 0x44ffff);
    this.mesh.rotation.x = -Math.PI / 2; // Horizontal orientation
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
    if (!ball.radius) return null;

    // Check if ball is close to plane surface
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

  animate(deltaTime: number) {
    // Tilt mechanism animation (30° maximum angle)
    const maxTilt = Math.PI / 6; // 30 degrees
    const tiltX = Math.sin(this.animationTime * 3) * maxTilt;
    const tiltZ = Math.cos(this.animationTime * 2) * maxTilt;
    
    this.mesh.rotation.x = -Math.PI / 2 + tiltX;
    this.mesh.rotation.z = tiltZ;
    
    this.updateBoundingBox();
  }
}