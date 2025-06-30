import * as THREE from 'three';
import { BasePrimitive } from './BasePrimitive';
import { PhysicsObject, Collision } from '../types';
import { PRIMITIVE_CONFIGS } from '../constants/primitives';

export class BoxPrimitive extends BasePrimitive {
  private localBounds: THREE.Box3;

  constructor(position: THREE.Vector3) {
    const config = PRIMITIVE_CONFIGS.box;
    const geometry = new THREE.BoxGeometry(4, 1, 4);
    super('box', geometry, position, config.color);
    this.restitution = config.restitution;
    
    // Define local bounding box for the box geometry (4x1x4)
    this.localBounds = new THREE.Box3(
      new THREE.Vector3(-2, -0.5, -2),
      new THREE.Vector3(2, 0.5, 2)
    );
    
    // Always spawn boxes at random angles - never flat
    this.setRandomAngles();
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

  checkCollision(ball: PhysicsObject): Collision | null {
    if (!ball.radius) return null;

    // Update the mesh's world matrix to ensure accurate transformations
    this.mesh.updateMatrixWorld();

    // Transform ball position to box's local coordinate system
    const localBallPosition = ball.position.clone();
    
    // Create inverse transformation matrix
    const inverseMatrix = new THREE.Matrix4();
    inverseMatrix.copy(this.mesh.matrixWorld).invert();
    
    // Transform ball position to local space
    localBallPosition.applyMatrix4(inverseMatrix);

    // Find closest point on the local AABB
    const closestPoint = new THREE.Vector3();
    this.localBounds.clampPoint(localBallPosition, closestPoint);
    
    // Calculate distance in local space
    const localDistance = localBallPosition.distanceTo(closestPoint);
    
    if (localDistance < ball.radius) {
      // Calculate local normal
      let localNormal = localBallPosition.clone().sub(closestPoint);
      
      if (localNormal.length() === 0) {
        // Ball is inside the box, push it out in the direction of least penetration
        const center = this.localBounds.getCenter(new THREE.Vector3());
        const size = this.localBounds.getSize(new THREE.Vector3());
        
        // Find which face is closest
        const distances = [
          Math.abs(localBallPosition.x - this.localBounds.max.x), // +X face
          Math.abs(localBallPosition.x - this.localBounds.min.x), // -X face
          Math.abs(localBallPosition.y - this.localBounds.max.y), // +Y face
          Math.abs(localBallPosition.y - this.localBounds.min.y), // -Y face
          Math.abs(localBallPosition.z - this.localBounds.max.z), // +Z face
          Math.abs(localBallPosition.z - this.localBounds.min.z)  // -Z face
        ];
        
        const minIndex = distances.indexOf(Math.min(...distances));
        
        switch (minIndex) {
          case 0: localNormal.set(1, 0, 0); break;  // +X
          case 1: localNormal.set(-1, 0, 0); break; // -X
          case 2: localNormal.set(0, 1, 0); break;  // +Y
          case 3: localNormal.set(0, -1, 0); break; // -Y
          case 4: localNormal.set(0, 0, 1); break;  // +Z
          case 5: localNormal.set(0, 0, -1); break; // -Z
        }
      } else {
        localNormal.normalize();
      }

      // Transform normal back to world space using only rotation
      const worldNormal = localNormal.clone();
      
      // Extract rotation matrix from the world matrix
      const rotationMatrix = new THREE.Matrix3();
      rotationMatrix.setFromMatrix4(this.mesh.matrixWorld);
      
      // Apply rotation to the normal
      worldNormal.applyMatrix3(rotationMatrix).normalize();
      
      const penetration = ball.radius - localDistance;
      
      return {
        object: this,
        normal: worldNormal,
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
  }

  reset(position: THREE.Vector3): void {
    // Call parent reset first
    super.reset(position);
    
    // Always set new random angles when resetting
    this.setRandomAngles();
  }
}