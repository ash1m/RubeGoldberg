export interface PhysicsObject {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mass: number;
  restitution: number;
  radius?: number;
  boundingBox?: THREE.Box3;
}

export interface Collision {
  object: PhysicsObject;
  normal: THREE.Vector3;
  penetration: number;
  primitive?: any;
}

export interface SimulationMetrics {
  ballVelocity: number;
  activePrimitives: number;
  collisionCount: number;
  fps: number;
  primitiveDistribution: Record<string, number>;
}

export type PrimitiveType = 'sphere' | 'box' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'dodecahedron';

export interface PrimitiveConfig {
  type: PrimitiveType;
  color: number;
  radius?: number;
  restitution: number;
}