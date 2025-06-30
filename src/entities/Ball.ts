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
    this.position = new THREE.Vector3(0, 80, 0); // Higher starting position
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
      opacity: 0.9,
      shininess: 100,
      specular: 0x444444
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
      size: 0.15,
      transparent: true,
      opacity: 0.8,
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

    // Apply subtle glow effect based on velocity
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    const velocityFactor = Math.min(this.velocity.length() / PHYSICS_CONSTANTS.MAX_VELOCITY, 1);
    material.emissive.setHSL(0.5, 0.8, velocityFactor * 0.2); // Reduced glow intensity

    // Reset if ball falls too far (with better positioning)
    if (this.position.y < -300) { // Deeper threshold before reset
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

      // Create velocity-based color gradient
      const alpha = i / SIMULATION_CONSTANTS.MAX_TRAIL_LENGTH;
      const velocityFactor = Math.min(this.velocity.length() / PHYSICS_CONSTANTS.MAX_VELOCITY, 1);
      
      colors[i * 3] = alpha * velocityFactor; // R
      colors[i * 3 + 1] = alpha; // G
      colors[i * 3 + 2] = 1; // B
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
    
    // Check less frequently and with higher threshold
    if (currentTime - this.lastStagnationCheck < 8000) return; // Check every 8 seconds
    this.lastStagnationCheck = currentTime;
    
    // Check if ball has been moving too slowly for too long
    if (this.velocity.length() < PHYSICS_CONSTANTS.MIN_VELOCITY * 3) {
      if (currentTime - this.lastCollisionTime > 10000) { // 10 seconds
        // Add smaller, more subtle random impulse
        const randomImpulse = new THREE.Vector3(
          (Math.random() - 0.5) * 0.3, // Reduced magnitude
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
      // Store impact velocity for analysis
      collision.impactVelocity = this.velocity.length();
      collision.contactPoint = this.position.clone();

      // The physics engine will handle the actual collision response
      // This method is called after physics resolution for any additional effects
      
      // Add more subtle visual feedback for collision
      this.addCollisionEffect(collision);
    }
  }

  private addCollisionEffect(collision: Collision): void {
    // Create more subtle temporary visual effect at collision point
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    const originalEmissive = material.emissive.clone();
    
    // Gentler flash effect
    material.emissive.setRGB(0.3, 0.6, 1.0); // Softer blue flash
    setTimeout(() => {
      material.emissive.copy(originalEmissive);
    }, 50); // Shorter duration

    // Smaller scale effect
    const originalScale = this.mesh.scale.clone();
    this.mesh.scale.multiplyScalar(1.05); // Much smaller scale change
    setTimeout(() => {
      this.mesh.scale.copy(originalScale);
    }, 80); // Shorter duration
  }

  private reset(): void {
    // Better reset positioning with more space
    this.position.set(
      (Math.random() - 0.5) * 30,
      80 + Math.random() * 40, // Higher and more variable starting height
      (Math.random() - 0.5) * 30
    );
    
    // Give it more substantial initial velocity to ensure continuous motion
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