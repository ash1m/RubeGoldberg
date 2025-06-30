import * as THREE from 'three';
import { PhysicsObject, Collision } from '../physics/PhysicsEngine';

export class Ball implements PhysicsObject {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public mass = 1;
  public restitution = 0.8;
  public radius = 0.5;

  private mesh: THREE.Mesh;
  private trail: THREE.Points;
  private trailPositions: THREE.Vector3[] = [];
  private maxTrailLength = 100;

  constructor(scene: THREE.Scene) {
    this.position = new THREE.Vector3(0, 50, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Create ball mesh
    const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    // Create particle trail
    this.createTrail(scene);
  }

  private createTrail(scene: THREE.Scene) {
    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxTrailLength * 3);
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const trailMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      vertexColors: true
    });

    this.trail = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(this.trail);
  }

  update(deltaTime: number) {
    // Apply gravity
    const gravity = new THREE.Vector3(0, -9.81, 0);
    this.velocity.add(gravity.clone().multiplyScalar(deltaTime));

    // Cap velocity
    if (this.velocity.length() > 10) {
      this.velocity.normalize().multiplyScalar(10);
    }

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.mesh.position.copy(this.position);

    // Update trail
    this.updateTrail();

    // Reset if ball falls too far
    if (this.position.y < -200) {
      this.position.set(0, 50, 0);
      this.velocity.set(0, 0, 0);
      this.trailPositions = [];
    }
  }

  private updateTrail() {
    // Add current position to trail
    this.trailPositions.push(this.position.clone());
    
    // Limit trail length
    if (this.trailPositions.length > this.maxTrailLength) {
      this.trailPositions.shift();
    }

    // Update trail geometry
    const positions = new Float32Array(this.maxTrailLength * 3);
    const colors = new Float32Array(this.maxTrailLength * 3);

    for (let i = 0; i < this.maxTrailLength; i++) {
      const pos = this.trailPositions[i] || this.position;
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      // Fade trail color
      const alpha = i / this.maxTrailLength;
      colors[i * 3] = alpha; // R
      colors[i * 3 + 1] = 1; // G
      colors[i * 3 + 2] = 1; // B
    }

    this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trail.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.color.needsUpdate = true;
  }

  handleCollisions(collisions: Collision[]) {
    for (const collision of collisions) {
      // Separate objects
      const separation = collision.normal.clone().multiplyScalar(collision.penetration);
      this.position.add(separation);

      // Calculate reflection
      const dot = this.velocity.dot(collision.normal);
      const reflection = collision.normal.clone().multiplyScalar(2 * dot);
      this.velocity.sub(reflection);

      // Apply restitution and energy loss
      this.velocity.multiplyScalar(this.restitution * 0.85);

      this.mesh.position.copy(this.position);
    }
  }
}