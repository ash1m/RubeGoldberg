import * as THREE from 'three';
import { Primitive } from './Primitive';
import { PhysicsObject, Collision } from '../../physics/PhysicsEngine';

export class ConePrimitive extends Primitive {
  constructor(position: THREE.Vector3) {
    const geometry = new THREE.ConeGeometry(2, 4, 16);
    super('cone', geometry, position, 0xffff44);
    this.radius = 2;
  }

  checkCollision(ball: PhysicsObject): Collision | null {
    if (!ball.radius || !this.radius) return null;

    // Simplified cone collision (treat as sphere)
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
    // Tip-over animation (60° range)
    const maxTip = Math.PI / 3; // 60 degrees
    const tipAmount = Math.sin(this.animationTime * 4) * maxTip;
    
    this.mesh.rotation.x = tipAmount;
    this.mesh.rotation.z = tipAmount * 0.5;
    
    // Wobble effect
    const wobble = Math.sin(this.animationTime * 8) * 0.1;
    this.mesh.position.y = this.originalPosition.y + wobble;
  }
}