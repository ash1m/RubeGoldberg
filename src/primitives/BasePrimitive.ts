import * as THREE from 'three';
import { PhysicsObject, Collision, PrimitiveType } from '../types';
import { SIMULATION_CONSTANTS } from '../constants/physics';

export abstract class BasePrimitive implements PhysicsObject {
  public mesh: THREE.Mesh;
  public position: THREE.Vector3;
  public velocity = new THREE.Vector3();
  public mass = 1;
  public restitution = 0.8;
  public type: PrimitiveType;
  public boundingBox?: THREE.Box3;
  public radius?: number;
  public shouldRemove = false;

  protected originalPosition: THREE.Vector3;
  protected isAnimating = false;
  protected animationTime = 0;

  constructor(type: PrimitiveType, geometry: THREE.BufferGeometry, position: THREE.Vector3, color: number) {
    this.type = type;
    this.position = position.clone();
    this.originalPosition = position.clone();

    // Create much brighter material with enhanced emissive glow and thicker wireframe
    const material = new THREE.MeshPhongMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 1.0, // Increased opacity
      emissive: new THREE.Color(color).multiplyScalar(0.6), // Much stronger emissive glow
      emissiveIntensity: 0.8, // Higher intensity
      shininess: 150,
      specular: new THREE.Color(color).multiplyScalar(1.2)
    });

    // Set wireframe line width to 4x the default for much thicker edges
    material.wireframeLinewidth = 4;

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);

    this.computeBoundingBox(geometry);
  }

  private computeBoundingBox(geometry: THREE.BufferGeometry): void {
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      this.boundingBox = geometry.boundingBox.clone();
      this.boundingBox.translate(this.position);
    }
  }

  abstract checkCollision(ball: PhysicsObject): Collision | null;
  abstract animate(deltaTime: number): void;

  // VISUAL UPDATE - Always called with real-time delta for smooth visuals
  updateVisuals(realDeltaTime: number): void {
    // Enhanced pulsing glow effect with higher intensity (always smooth)
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    const pulseIntensity = 0.6 + Math.sin(performance.now() * 0.004) * 0.4; // Stronger pulse
    material.emissiveIntensity = pulseIntensity;

    if (this.isAnimating) {
      this.animationTime += realDeltaTime; // Use real-time delta for smooth animations
      this.animate(realDeltaTime); // Pass real-time delta to animation

      // Much brighter glow during animation
      material.emissiveIntensity = pulseIntensity + 0.8; // Much higher boost
      material.opacity = 1.0;

      if (this.animationTime >= SIMULATION_CONSTANTS.ANIMATION_DURATION) {
        this.isAnimating = false;
        this.animationTime = 0;
        this.fadeOut();
      }
    }
  }

  // Legacy update method for backward compatibility - now calls visual update
  update(deltaTime: number): void {
    this.updateVisuals(deltaTime);
  }

  onCollision(): void {
    this.isAnimating = true;
    this.animationTime = 0;
    
    // Intense flash effect on collision
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    material.emissiveIntensity = 2.0; // Very bright flash
    material.opacity = 1.0;
  }

  private fadeOut(): void {
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    const fadeStep = 0.04; // Slower fade for more visibility
    const fadeInterval = SIMULATION_CONSTANTS.FADE_DURATION * 40;
    
    const fade = setInterval(() => {
      material.opacity -= fadeStep;
      material.emissiveIntensity -= fadeStep * 0.4;
      if (material.opacity <= 0) {
        clearInterval(fade);
        this.shouldRemove = true;
      }
    }, fadeInterval);
  }

  reset(position: THREE.Vector3): void {
    this.position.copy(position);
    this.originalPosition.copy(position);
    this.mesh.position.copy(position);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.scale.set(1, 1, 1);
    this.isAnimating = false;
    this.animationTime = 0;
    this.shouldRemove = false;
    
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    material.opacity = 1.0;
    material.emissiveIntensity = 0.8;
    // Ensure line width remains 4x after reset
    material.wireframeLinewidth = 4;

    if (this.boundingBox && this.mesh.geometry.boundingBox) {
      this.boundingBox = this.mesh.geometry.boundingBox.clone();
      this.boundingBox.translate(this.position);
    }
  }
}