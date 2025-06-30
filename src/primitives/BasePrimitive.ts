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

    const material = new THREE.MeshLambertMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.7
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
    if (this.isAnimating) {
      this.animationTime += deltaTime;
      this.animate(deltaTime);

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
  }

  private fadeOut(): void {
    const material = this.mesh.material as THREE.MeshLambertMaterial;
    const fadeStep = 0.1;
    const fadeInterval = SIMULATION_CONSTANTS.FADE_DURATION * 100;
    
    const fade = setInterval(() => {
      material.opacity -= fadeStep;
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
    
    const material = this.mesh.material as THREE.MeshLambertMaterial;
    material.opacity = 0.7;

    if (this.boundingBox && this.mesh.geometry.boundingBox) {
      this.boundingBox = this.mesh.geometry.boundingBox.clone();
      this.boundingBox.translate(this.position);
    }
  }
}

export { BasePrimitive }