import * as THREE from 'three';
import { PhysicsObject, Collision } from '../types';
import { PHYSICS_CONSTANTS } from '../constants/physics';

export class PhysicsEngine {
  private gravity = new THREE.Vector3(0, PHYSICS_CONSTANTS.GRAVITY, 0);

  applyGravity(object: PhysicsObject, deltaTime: number): void {
    const gravityForce = this.gravity.clone().multiplyScalar(object.mass * deltaTime);
    object.velocity.add(gravityForce);
    
    // Cap velocity
    if (object.velocity.length() > PHYSICS_CONSTANTS.MAX_VELOCITY) {
      object.velocity.normalize().multiplyScalar(PHYSICS_CONSTANTS.MAX_VELOCITY);
    }
  }

  updatePosition(object: PhysicsObject, deltaTime: number): void {
    const displacement = object.velocity.clone().multiplyScalar(deltaTime);
    object.position.add(displacement);
  }

  resolveCollision(object: PhysicsObject, collision: Collision): void {
    // Separate objects
    const separation = collision.normal.clone().multiplyScalar(collision.penetration);
    object.position.add(separation);

    // Calculate velocity response
    const relativeVelocity = object.velocity.clone();
    const velocityAlongNormal = relativeVelocity.dot(collision.normal);

    if (velocityAlongNormal > 0) return; // Objects separating

    const restitution = Math.min(object.restitution, collision.object.restitution);
    const impulseScalar = -(1 + restitution) * velocityAlongNormal;
    
    const impulse = collision.normal.clone().multiplyScalar(impulseScalar);
    object.velocity.add(impulse);

    // Apply velocity reduction
    object.velocity.multiplyScalar(PHYSICS_CONSTANTS.VELOCITY_REDUCTION);
  }

  checkSphereCollision(sphere1: PhysicsObject, sphere2: PhysicsObject): Collision | null {
    if (!sphere1.radius || !sphere2.radius) return null;

    const distance = sphere1.position.distanceTo(sphere2.position);
    const minDistance = sphere1.radius + sphere2.radius;

    if (distance < minDistance) {
      const normal = sphere2.position.clone().sub(sphere1.position).normalize();
      const penetration = minDistance - distance;
      
      return {
        object: sphere2,
        normal,
        penetration,
      };
    }

    return null;
  }

  checkSphereBoxCollision(sphere: PhysicsObject, box: PhysicsObject): Collision | null {
    if (!sphere.radius || !box.boundingBox) return null;

    const closestPoint = new THREE.Vector3();
    box.boundingBox.clampPoint(sphere.position, closestPoint);
    
    const distance = sphere.position.distanceTo(closestPoint);
    
    if (distance < sphere.radius) {
      const normal = sphere.position.clone().sub(closestPoint).normalize();
      if (normal.length() === 0) {
        normal.set(0, 1, 0); // Default upward normal
      }
      const penetration = sphere.radius - distance;
      
      return {
        object: box,
        normal,
        penetration,
      };
    }

    return null;
  }
}