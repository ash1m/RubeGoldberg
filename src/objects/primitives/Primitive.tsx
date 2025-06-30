import * as THREE from 'three';
import { PhysicsObject, Collision } from '../../physics/PhysicsEngine';

export type PrimitiveType = 'sphere' | 'box' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'dodecahedron';

export abstract class Primitive implements PhysicsObject {
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
  protected maxAnimationTime = 2;

  constructor(type: PrimitiveType, geometry: THREE.BufferGeometry, position: THREE.Vector3, color: number) {
    this.type = type;
    this.position = position.clone();
    this.originalPosition = position.clone();

    // Create wireframe material with glow effect
    const material = new THREE.MeshLambertMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);

    // Calculate bounding box
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      this.boundingBox = geometry.boundingBox.clone();
      this.boundingBox.translate(this.position);
    }
  }

  abstract checkCollision(ball: PhysicsObject): Collision | null;
  abstract animate(deltaTime: number): void;

  update(deltaTime: number) {
    if (this.isAnimating) {
      this.animationTime += deltaTime;
      this.animate(deltaTime);

      if (this.animationTime >= this.maxAnimationTime) {
        this.isAnimating = false;
        this.animationTime = 0;
        // Fade out after animation
        this.fadeOut();
      }
    }
  }

  onCollision() {
    this.isAnimating = true;
    this.animationTime = 0;
  }

  private fadeOut() {
    const material = this.mesh.material as THREE.MeshLambertMaterial;
    const fadeTime = 1; // 1 second fade
    
    const fadeInterval = setInterval(() => {
      material.opacity -= 0.1;
      if (material.opacity <= 0) {
        clearInterval(fadeInterval);
        this.shouldRemove = true;
      }
    }, fadeTime * 100);
  }

  reset(position: THREE.Vector3) {
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

    // Update bounding box
    if (this.boundingBox) {
      this.mesh.geometry.computeBoundingBox();
      if (this.mesh.geometry.boundingBox) {
        this.boundingBox = this.mesh.geometry.boundingBox.clone();
        this.boundingBox.translate(this.position);
      }
    }
  }
}

export { Primitive }