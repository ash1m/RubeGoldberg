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

    // Create brighter material with emissive glow
    const material = new THREE.MeshPhongMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
      emissive: new THREE.Color(color).multiplyScalar(0.3), // Add emissive glow
      emissiveIntensity: 0.5,
      shininess: 100,
      specular: new THREE.Color(color).multiplyScalar(0.8)
    });

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

  update(deltaTime: number): void {
    // Add subtle pulsing glow effect
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    const pulseIntensity = 0.3 + Math.sin(performance.now() * 0.003) * 0.2;
    material.emissiveIntensity = pulseIntensity;

    if (this.isAnimating) {
      this.animationTime += deltaTime;
      this.animate(deltaTime);

      // Increase glow during animation
      material.emissiveIntensity = pulseIntensity + 0.4;
      material.opacity = 0.95;

      if (this.animationTime >= SIMULATION_CONSTANTS.ANIMATION_DURATION) {
        this.isAnimating = false;
        this.animationTime = 0;
        this.fadeOut();
      }
    }
  }

  onCollision(): void {
    this.isAnimating = true;
    this.animationTime = 0;
    
    // Flash effect on collision
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    material.emissiveIntensity = 1.0;
    material.opacity = 1.0;
  }

  private fadeOut(): void {
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    const fadeStep = 0.05;
    const fadeInterval = SIMULATION_CONSTANTS.FADE_DURATION * 50;
    
    const fade = setInterval(() => {
      material.opacity -= fadeStep;
      material.emissiveIntensity -= fadeStep * 0.5;
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
    material.opacity = 0.9;
    material.emissiveIntensity = 0.5;

    if (this.boundingBox && this.mesh.geometry.boundingBox) {
      this.boundingBox = this.mesh.geometry.boundingBox.clone();
      this.boundingBox.translate(this.position);
    }
  }
}