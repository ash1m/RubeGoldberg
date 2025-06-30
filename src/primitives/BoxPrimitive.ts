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
    
    // Always spawn boxes at random angles - never flat
    this.setRandomAngles();
    this.updateBoundingBox();
  }

  private setRandomAngles(): void {
    // Generate random rotations for all axes to ensure boxes are never flat
    const minAngle = Math.PI / 8; // 22.5 degrees minimum
    const maxAngle = Math.PI / 3; // 60 degrees maximum
    
    // X rotation (pitch) - ensures box isn't lying flat horizontally
    const xRotation = (Math.random() - 0.5) * 2 * (maxAngle - minAngle) + 
                     (Math.random() > 0.5 ? minAngle : -minAngle);
    
    // Y rotation (yaw) - random orientation
    const yRotation = Math.random() * Math.PI * 2;
    
    // Z rotation (roll) - adds more dynamic positioning
    const zRotation = (Math.random() - 0.5) * 2 * (maxAngle - minAngle) + 
                     (Math.random() > 0.5 ? minAngle : -minAngle);
    
    this.mesh.rotation.set(xRotation, yRotation, zRotation);
  }

  private updateBoundingBox(): void {
    // Update bounding box to account for rotation
    this.mesh.geometry.computeBoundingBox();
    if (this.mesh.geometry.boundingBox) {
      // Create a new bounding box that encompasses the rotated geometry
      const box = new THREE.Box3();
      box.setFromObject(this.mesh);
      this.boundingBox = box;
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
    // Enhanced animation that works with the angled positioning
    const maxRotation = Math.PI / 6; // 30 degrees additional rotation
    const rotationAmount = Math.sin(this.animationTime * 3) * maxRotation;
    
    // Add to existing rotation instead of replacing it
    this.mesh.rotation.z += rotationAmount * deltaTime;
    this.mesh.rotation.x += rotationAmount * deltaTime * 0.5;
    
    this.updateBoundingBox();
  }

  reset(position: THREE.Vector3): void {
    // Call parent reset first
    super.reset(position);
    
    // Always set new random angles when resetting
    this.setRandomAngles();
    this.updateBoundingBox();
  }
}