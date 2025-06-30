import * as THREE from 'three';

export interface PhysicsObject {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mass: number;
  restitution: number;
  radius?: number;
  boundingBox?: THREE.Box3;
}

export interface ForceVector {
  force: THREE.Vector3;
  duration: number;
  type: 'impulse' | 'continuous';
}

export interface Collision {
  object: PhysicsObject;
  normal: THREE.Vector3;
  penetration: number;
  primitive?: any;
  impactVelocity?: number;
  contactPoint?: THREE.Vector3;
}

export interface SimulationMetrics {
  ballVelocity: number;
  activePrimitives: number;
  collisionCount: number;
  fps: number;
  primitiveDistribution: Record<string, number>;
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
}

export type PrimitiveType = 'sphere' | 'box' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'dodecahedron';

export interface PrimitiveConfig {
  type: PrimitiveType;
  color: number;
  radius?: number;
  restitution: number;
}