import * as THREE from 'three';
import { PhysicsObject, Collision } from '../types';
import { PHYSICS_CONSTANTS, SIMULATION_CONSTANTS } from '../constants/physics';

export class Ball implements PhysicsObject {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public mass = PHYSICS_CONSTANTS.BALL_MASS;
  public restitution = PHYSICS_CONSTANTS.BALL_RESTITUTION;
  public radius = PHYSICS_CONSTANTS.BALL_RADIUS;
  public id = 'ball';

  private mesh: THREE.Mesh;
  private trail: THREE.Points;
  private trailPositions: THREE.Vector3[] = [];
  private lastCollisionTime = 0;
  private energyHistory: number[] = [];
  private lastStagnationCheck = 0;

  constructor(scene: THREE.Scene) {
    this.position = new THREE.Vector3(0, 80, 0);
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      0,
      (Math.random() - 0.5) * 3
    );

    this.createMesh(scene);
    this.createTrail(scene);
  }

  private createMesh(scene: THREE.Scene): void {
    const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.95,
      shininess: 100,
      specular: 0x888888,
      emissive: new THREE.Color(0x00ffff).multiplyScalar(0.2),
      emissiveIntensity: 0.4
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);
  }

  private createTrail(scene: THREE.Scene): void {
    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(SIMULATION_CONSTANTS.MAX_TRAIL_LENGTH * 3);
    const colors = new Float32Array(SIMULATION_CONSTANTS.MAX_TRAIL_LENGTH * 3);
    
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const trailMaterial = new THREE.PointsMaterial({
      size: 0.2,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    this.trail = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(this.trail);
  }

  update(deltaTime: number): void {
    // Update mesh position
    this.mesh.position.copy(this.position);
    
    // Add rotation based on velocity for visual feedback
    const rotationSpeed = this.velocity.length() * 0.1;
    this.mesh.rotation.x += rotationSpeed * deltaTime;
    this.mesh.rotation.z += rotationSpeed * deltaTime * 0.7;

    // Update trail
    this.updateTrail();

    // Update energy history for analysis
    this.updateEnergyHistory();

    // Enhanced glow effect based on velocity
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    const velocityFactor = Math.min(this.velocity.length() / PHYSICS_CONSTANTS.MAX_VELOCITY, 1);
    
    // Brighter emissive glow that changes with velocity
    const hue = 0.5 + velocityFactor * 0.3; // Cyan to blue-white
    const saturation = 0.8;
    const lightness = 0.3 + velocityFactor * 0.4;
    material.emissive.setHSL(hue, saturation, lightness);
    material.emissiveIntensity = 0.4 + velocityFactor * 0.6;

    // Reset if ball falls too far (with better positioning)
    if (this.position.y < -300) {
      this.reset();
    }

    // Prevent ball from getting stuck in low-energy states
    this.preventStagnation();
  }

  private updateTrail(): void {
    // Add current position with some spacing
    if (this.trailPositions.length === 0 || 
        this.position.distanceTo(this.trailPositions[this.trailPositions.length - 1]) > 0.5) {
      this.trailPositions.push(this.position.clone());
    }
    
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

      // Brighter velocity-based color gradient
      const alpha = i / SIMULATION_CONSTANTS.MAX_TRAIL_LENGTH;
      const velocityFactor = Math.min(this.velocity.length() / PHYSICS_CONSTANTS.MAX_VELOCITY, 1);
      
      // Enhanced trail colors
      colors[i * 3] = alpha * velocityFactor * 1.5; // R - brighter
      colors[i * 3 + 1] = alpha * 1.2; // G - brighter
      colors[i * 3 + 2] = 1.5; // B - much brighter
    }

    this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trail.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.color.needsUpdate = true;
  }

  private updateEnergyHistory(): void {
    const kineticEnergy = 0.5 * this.mass * this.velocity.lengthSq();
    this.energyHistory.push(kineticEnergy);
    
    if (this.energyHistory.length > 100) {
      this.energyHistory.shift();
    }
  }

  private preventStagnation(): void {
    const currentTime = performance.now();
    
    if (currentTime - this.lastStagnationCheck < 8000) return;
    this.lastStagnationCheck = currentTime;
    
    if (this.velocity.length() < PHYSICS_CONSTANTS.MIN_VELOCITY * 3) {
      if (currentTime - this.lastCollisionTime > 10000) {
        const randomImpulse = new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          Math.random() * 0.2,
          (Math.random() - 0.5) * 0.3
        );
        this.velocity.add(randomImpulse);
        this.lastCollisionTime = currentTime;
      }
    }
  }

  handleCollisions(collisions: Collision[]): void {
    const currentTime = performance.now();
    this.lastCollisionTime = currentTime;

    for (const collision of collisions) {
      collision.impactVelocity = this.velocity.length();
      collision.contactPoint = this.position.clone();
      
      this.addCollisionEffect(collision);
    }
  }

  private addCollisionEffect(collision: Collision): void {
    // Enhanced collision visual effect
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    const originalEmissive = material.emissive.clone();
    const originalIntensity = material.emissiveIntensity;
    
    // Bright white flash effect
    material.emissive.setRGB(1.0, 1.0, 1.0);
    material.emissiveIntensity = 1.5;
    
    setTimeout(() => {
      material.emissive.copy(originalEmissive);
      material.emissiveIntensity = originalIntensity;
    }, 100);

    // Enhanced scale effect
    const originalScale = this.mesh.scale.clone();
    this.mesh.scale.multiplyScalar(1.15);
    setTimeout(() => {
      this.mesh.scale.copy(originalScale);
    }, 120);
  }

  private reset(): void {
    this.position.set(
      (Math.random() - 0.5) * 30,
      80 + Math.random() * 40,
      (Math.random() - 0.5) * 30
    );
    
    this.velocity.set(
      (Math.random() - 0.5) * 5,
      Math.random() * 3,
      (Math.random() - 0.5) * 5
    );
    
    this.trailPositions = [];
    this.energyHistory = [];
    this.lastCollisionTime = performance.now();
    this.lastStagnationCheck = performance.now();
  }

  getKineticEnergy(): number {
    return 0.5 * this.mass * this.velocity.lengthSq();
  }

  getPotentialEnergy(referenceHeight: number = 0): number {
    return this.mass * Math.abs(PHYSICS_CONSTANTS.GRAVITY) * (this.position.y - referenceHeight);
  }

  getTotalEnergy(referenceHeight: number = 0): number {
    return this.getKineticEnergy() + this.getPotentialEnergy(referenceHeight);
  }

  getAverageEnergy(): number {
    if (this.energyHistory.length === 0) return 0;
    return this.energyHistory.reduce((sum, energy) => sum + energy, 0) / this.energyHistory.length;
  }
}