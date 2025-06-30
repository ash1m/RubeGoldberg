import * as THREE from 'three';

export class MathUtils {
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  static lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  static randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static randomVector3InSphere(radius: number): THREE.Vector3 {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;
    
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    
    return new THREE.Vector3(
      r * sinPhi * cosTheta,
      r * sinPhi * sinTheta,
      r * cosPhi
    );
  }

  static distanceToPlane(point: THREE.Vector3, planePoint: THREE.Vector3, planeNormal: THREE.Vector3): number {
    return Math.abs(point.clone().sub(planePoint).dot(planeNormal));
  }
}