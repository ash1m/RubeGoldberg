import * as THREE from 'three';

export interface PhysicsObject {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mass: number;
  restitution: number;
  radius?: number;
  boundingBox?: THREE.Box3;
}

export interface Collision {
  object: PhysicsObject;
  normal: THREE.Vector3;
  penetration: number;
  primitive?: any;
}

export class PhysicsEngine {
  private gravity = new THREE.Vector3(0, -9.81, 0);
  private maxVelocity = 10;

  update(deltaTime: number) {
    // Physics updates are handled per object
  }

  applyGravity(object: PhysicsObject, deltaTime: number) {
    const gravityForce = this.gravity.clone().multiplyScalar(object.mass * deltaTime);
    object.velocity.add(gravityForce);
    
    // Cap velocity
    if (object.velocity.length() > this.maxVelocity) {
      object.velocity.normalize().multiplyScalar(this.maxVelocity);
    }
  }

  updatePosition(object: PhysicsObject, deltaTime: number) {
    const displacement = object.velocity.clone().multiplyScalar(deltaTime);
    object.position.add(displacement);
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
      const penetration = sphere.radius - distance;
      
      return {
        object: box,
        normal,
        penetration,
      };
    }

    return null;
  }

  resolveCollision(object: PhysicsObject, collision: Collision) {
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

    // Reduce velocity by 15% as specified
    object.velocity.multiplyScalar(0.85);
  }
}