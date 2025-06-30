import * as THREE from 'three';
import { Primitive } from './Primitive';
import { PhysicsObject, Collision } from '../../physics/PhysicsEngine';

export class TorusPrimitive extends Primitive {
  constructor(position: THREE.Vector3) {
    const geometry = new THREE.TorusGeometry(3, 1, 8, 16);
    super('torus', geometry, position, 0xff44ff);
    this.radius = 4; // Outer radius for collision
  }

  checkCollision(ball: PhysicsObject): Collision | null {
    if (!ball.radius || !this.radius) return null;

    // Simplified torus collision (treat as thick ring)
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

  animate(deltaTime: number) {
    // Pendulum swing animation (120° arc)
    const maxSwing = (Math.PI * 2) / 3; // 120 degrees
    const swingAmount = Math.sin(this.animationTime * 1.5) * maxSwing;
    
    this.mesh.rotation.z = swingAmount;
    
    // Rotate around its own axis
    this.mesh.rotation.y += deltaTime * 2;
  }
}