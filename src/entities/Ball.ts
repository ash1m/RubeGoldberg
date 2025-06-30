import * as THREE from 'three';
import { PhysicsObject, Collision } from '../types';
import { PHYSICS_CONSTANTS, SIMULATION_CONSTANTS } from '../constants/physics';

export class Ball implements PhysicsObject {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public mass = PHYSICS_CONSTANTS.BALL_MASS;
  public restitution = PHYSICS_CONSTANTS.BALL_RESTITUTION;
  public radius = PHYSICS_CONSTANTS.BALL_RADIUS;

  private mesh: THREE.Mesh;
  private trail: THREE.Points;
  private trailPositions: THREE.Vector3[] = [];

  constructor(scene: THREE.Scene) {
    this.position = new THREE.Vector3(0, 50, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    this.createMesh(scene);
    this.createTrail(scene);
  }

  private createMesh(scene: THREE.Scene): void {
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
  }

  private createTrail(scene: THREE.Scene): void {
    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(SIMULATION_CONSTANTS.MAX_TRAIL_LENGTH * 3);
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

  update(deltaTime: number): void {
    // Apply gravity
    const gravity = new THREE.Vector3(0, PHYSICS_CONSTANTS.GRAVITY, 0);
    this.velocity.add(gravity.clone().multiplyScalar(deltaTime));

    // Cap velocity
    if (this.velocity.length() > PHYSICS_CONSTANTS.MAX_VELOCITY) {
      this.velocity.normalize().multiplyScalar(PHYSICS_CONSTANTS.MAX_VELOCITY);
    }

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.mesh.position.copy(this.position);

    // Update trail
    this.updateTrail();

    // Reset if ball falls too far
    if (this.position.y < -200) {
      this.reset();
    }
  }

  private updateTrail(): void {
    this.trailPositions.push(this.position.clone());
    
    if (this.trailPositions.length > SIMULATION_CONSTANTS.MAX_TRAIL_LENGTH) {
      this.trailPositions.shift();
    }

    const positions = new Float32Array(SIMULATION_CONSTANTS.MAX_TRAIL_LENGTH * 3);
    const colors = new Float32Array(SIMULATION_CONSTANTS.MAX_TRAIL_LENGTH * 3);

    for (let i = 0; i < SIMULATION_CONSTANTS.MAX_TRAIL_LENGTH; i++) {
      const pos = this.trailPositions[i] || this.position;
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const alpha = i / SIMULATION_CONSTANTS.MAX_TRAIL_LENGTH;
      colors[i * 3] = alpha;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }

    this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trail.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.color.needsUpdate = true;
  }

  handleCollisions(collisions: Collision[]): void {
    for (const collision of collisions) {
      const separation = collision.normal.clone().multiplyScalar(collision.penetration);
      this.position.add(separation);

      const dot = this.velocity.dot(collision.normal);
      const reflection = collision.normal.clone().multiplyScalar(2 * dot);
      this.velocity.sub(reflection);

      this.velocity.multiplyScalar(this.restitution * PHYSICS_CONSTANTS.VELOCITY_REDUCTION);
      this.mesh.position.copy(this.position);
    }
  }

  private reset(): void {
    this.position.set(0, 50, 0);
    this.velocity.set(0, 0, 0);
    this.trailPositions = [];
  }
}