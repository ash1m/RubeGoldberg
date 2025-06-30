import { PrimitiveConfig } from '../types';

export const PRIMITIVE_CONFIGS: Record<string, PrimitiveConfig> = {
  sphere: {
    type: 'sphere',
    color: 0xff4444,
    radius: 2,
    restitution: 0.8
  },
  box: {
    type: 'box',
    color: 0x44ff44,
    restitution: 0.7
  },
  cylinder: {
    type: 'cylinder',
    color: 0x4444ff,
    radius: 1.5,
    restitution: 0.6
  },
  cone: {
    type: 'cone',
    color: 0xffff44,
    radius: 2,
    restitution: 0.5
  },
  torus: {
    type: 'torus',
    color: 0xff44ff,
    radius: 4,
    restitution: 0.6
  },
  plane: {
    type: 'plane',
    color: 0x44ffff,
    restitution: 0.8
  },
  dodecahedron: {
    type: 'dodecahedron',
    color: 0xffffff,
    radius: 2.5,
    restitution: 0.9
  }
} as const;