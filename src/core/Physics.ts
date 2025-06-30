import * as THREE from 'three';
import { PhysicsObject, Collision, ForceVector } from '../types';
import { PHYSICS_CONSTANTS, SIMULATION_CONSTANTS } from '../constants/physics';

export class PhysicsEngine {
  private gravity = new THREE.Vector3(0, PHYSICS_CONSTANTS.GRAVITY, 0);
  private activeForces: Map<string, ForceVector[]> = new Map();

  addForce(objectId: string, force: ForceVector): void {
    if (!this.activeForces.has(objectId)) {
      this.activeForces.set(objectId, []);
    }
    this.activeForces.get(objectId)!.push(force);
  }

  clearForces(objectId: string): void {
    this.activeForces.delete(objectId);
  }

  integrateForces(object: PhysicsObject, objectId: string, deltaTime: number): void {
    // Apply gravity as continuous force
    const gravityForce: ForceVector = {
      force: this.gravity.clone().multiplyScalar(object.mass),
      duration: deltaTime,
      type: 'continuous'
    };
    
    this.addForce(objectId, gravityForce);

    // Get all forces acting on object
    const forces = this.activeForces.get(objectId) || [];
    const totalForce = new THREE.Vector3();

    // Accumulate all forces
    forces.forEach(forceVector => {
      if (forceVector.type === 'impulse') {
        // Impulse forces are applied instantly
        const impulse = forceVector.force.clone().divideScalar(object.mass);
        object.velocity.add(impulse);
      } else {
        // Continuous forces accumulate
        totalForce.add(forceVector.force);
      }
    });

    // Apply accumulated continuous forces using Verlet integration
    if (totalForce.length() > PHYSICS_CONSTANTS.FORCE_ACCUMULATION_THRESHOLD) {
      const acceleration = totalForce.divideScalar(object.mass);
      
      // Verlet integration for better stability
      const velocityChange = acceleration.multiplyScalar(deltaTime);
      object.velocity.add(velocityChange);
    }

    // Apply air resistance (continuous force opposing motion)
    object.velocity.multiplyScalar(PHYSICS_CONSTANTS.AIR_RESISTANCE);

    // Ensure minimum velocity to prevent complete stops
    if (object.velocity.length() > 0 && object.velocity.length() < PHYSICS_CONSTANTS.MIN_VELOCITY) {
      object.velocity.normalize().multiplyScalar(PHYSICS_CONSTANTS.MIN_VELOCITY);
    }

    // Cap maximum velocity for stability
    if (object.velocity.length() > PHYSICS_CONSTANTS.MAX_VELOCITY) {
      object.velocity.normalize().multiplyScalar(PHYSICS_CONSTANTS.MAX_VELOCITY);
    }

    // Clear impulse forces (continuous forces remain for next frame)
    this.activeForces.set(objectId, forces.filter(f => f.type === 'continuous'));
  }

  updatePosition(object: PhysicsObject, deltaTime: number): void {
    // Use multiple integration steps for better accuracy
    const steps = SIMULATION_CONSTANTS.FORCE_INTEGRATION_STEPS;
    const stepTime = deltaTime / steps;

    for (let i = 0; i < steps; i++) {
      const displacement = object.velocity.clone().multiplyScalar(stepTime);
      object.position.add(displacement);
    }
  }

  resolveCollision(object: PhysicsObject, collision: Collision, objectId: string): void {
    // Separate objects precisely without overshooting
    const separation = collision.normal.clone().multiplyScalar(collision.penetration);
    object.position.add(separation);

    // Calculate relative velocity
    const relativeVelocity = object.velocity.clone();
    const velocityAlongNormal = relativeVelocity.dot(collision.normal);

    // Don't resolve if objects are separating
    if (velocityAlongNormal > 0) return;

    // Calculate restitution (energy conservation)
    const restitution = Math.min(object.restitution, collision.object.restitution) * 
                       PHYSICS_CONSTANTS.ENERGY_CONSERVATION_FACTOR;

    // Calculate impulse scalar using proper physics formula
    const impulseScalar = -(1 + restitution) * velocityAlongNormal;
    
    // Apply mass considerations (assuming collision object has infinite mass)
    const massRatio = 1; // For static objects
    const finalImpulse = impulseScalar * massRatio;

    // Create impulse force
    const impulseForce: ForceVector = {
      force: collision.normal.clone().multiplyScalar(finalImpulse * object.mass),
      duration: 0,
      type: 'impulse'
    };

    this.addForce(objectId, impulseForce);

    // Add tangential friction force for realistic surface interaction
    const tangentialVelocity = relativeVelocity.clone().sub(
      collision.normal.clone().multiplyScalar(velocityAlongNormal)
    );

    if (tangentialVelocity.length() > 0) {
      const frictionForce: ForceVector = {
        force: tangentialVelocity.normalize().multiplyScalar(-0.1 * object.mass),
        duration: 0.1,
        type: 'continuous'
      };
      this.addForce(objectId, frictionForce);
    }

    // Apply rolling friction for surfaces
    if (Math.abs(collision.normal.y) > 0.7) { // Horizontal surface
      object.velocity.multiplyScalar(PHYSICS_CONSTANTS.ROLLING_FRICTION);
    }

    // Ensure collision doesn't completely stop the ball
    if (object.velocity.length() < PHYSICS_CONSTANTS.MIN_VELOCITY) {
      const randomDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random(),
        (Math.random() - 0.5) * 2
      ).normalize();
      
      object.velocity.copy(randomDirection.multiplyScalar(PHYSICS_CONSTANTS.MIN_VELOCITY));
    }
  }

  checkSphereCollision(sphere1: PhysicsObject, sphere2: PhysicsObject): Collision | null {
    if (!sphere1.radius || !sphere2.radius) return null;

    const distance = sphere1.position.distanceTo(sphere2.position);
    const minDistance = sphere1.radius + sphere2.radius;

    if (distance < minDistance) {
      const normal = sphere2.position.clone().sub(sphere1.position);
      
      // Handle edge case where objects are at same position
      if (normal.length() === 0) {
        normal.set(0, 1, 0);
      } else {
        normal.normalize();
      }
      
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
      const normal = sphere.position.clone().sub(closestPoint);
      
      if (normal.length() === 0) {
        // Ball is inside box, push up
        normal.set(0, 1, 0);
      } else {
        normal.normalize();
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

  addRandomForce(objectId: string, magnitude: number): void {
    const randomDirection = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 0.5,
      (Math.random() - 0.5) * 2
    ).normalize();

    const randomForce: ForceVector = {
      force: randomDirection.multiplyScalar(magnitude),
      duration: 0.1,
      type: 'impulse'
    };

    this.addForce(objectId, randomForce);
  }

  getKineticEnergy(object: PhysicsObject): number {
    return 0.5 * object.mass * object.velocity.lengthSq();
  }

  getPotentialEnergy(object: PhysicsObject, referenceHeight: number = 0): number {
    return object.mass * Math.abs(PHYSICS_CONSTANTS.GRAVITY) * (object.position.y - referenceHeight);
  }

  getTotalEnergy(object: PhysicsObject, referenceHeight: number = 0): number {
    return this.getKineticEnergy(object) + this.getPotentialEnergy(object, referenceHeight);
  }
}