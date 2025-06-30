import * as THREE from 'three';

export class SpaceParticles {
  private particleSystems: THREE.Points[] = [];
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private lastCameraPosition = new THREE.Vector3();

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.createParticleLayers();
  }

  private createParticleLayers(): void {
    // Create multiple layers for parallax effect with much brighter colors
    const layers = [
      { count: 2500, size: 0.8, distance: 800, speed: 0.1, color: 0x88bbff }, // Brighter blue
      { count: 2000, size: 1.2, distance: 600, speed: 0.2, color: 0xaaccff }, // Brighter light blue
      { count: 1500, size: 1.8, distance: 400, speed: 0.3, color: 0xccddff }, // Much brighter
      { count: 800, size: 2.5, distance: 200, speed: 0.5, color: 0xffffff }   // Bright white
    ];

    layers.forEach((layer, index) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(layer.count * 3);
      const colors = new Float32Array(layer.count * 3);
      const sizes = new Float32Array(layer.count);

      for (let i = 0; i < layer.count; i++) {
        // Create spherical distribution around the camera
        const radius = layer.distance + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // Much brighter particles with higher minimum brightness
        const brightness = 0.7 + Math.random() * 0.8; // Increased from 0.3-1.0 to 0.7-1.5
        const color = new THREE.Color(layer.color);
        color.multiplyScalar(brightness);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // Larger particle sizes
        sizes[i] = layer.size * (0.8 + Math.random() * 0.7); // Increased size multiplier
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          pixelRatio: { value: window.devicePixelRatio }
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vAlpha;
          uniform float time;

          void main() {
            vColor = color;
            
            // Enhanced twinkling effect with brighter base
            float twinkle = sin(time * 3.0 + position.x * 0.01 + position.y * 0.01) * 0.3 + 0.7;
            vAlpha = 0.8 + twinkle * 0.6; // Much brighter base alpha
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (350.0 / -mvPosition.z); // Larger point size
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            // Create circular particles with soft edges and brighter core
            float distance = length(gl_PointCoord - vec2(0.5));
            if (distance > 0.5) discard;
            
            // Enhanced brightness with brighter core
            float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
            alpha = pow(alpha, 0.6); // Brighter falloff
            alpha *= vAlpha;
            
            // Boost overall brightness
            vec3 finalColor = vColor * 1.4; // 40% brighter
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const particles = new THREE.Points(geometry, material);
      particles.userData = { 
        layer: index, 
        speed: layer.speed,
        originalPositions: positions.slice()
      };
      
      this.particleSystems.push(particles);
      this.scene.add(particles);
    });
  }

  update(deltaTime: number): void {
    const currentTime = performance.now() * 0.001;
    const cameraMovement = this.camera.position.clone().sub(this.lastCameraPosition);

    this.particleSystems.forEach((system, index) => {
      const material = system.material as THREE.ShaderMaterial;
      material.uniforms.time.value = currentTime;

      // Apply parallax effect based on camera movement
      const speed = system.userData.speed;
      const positions = system.geometry.attributes.position.array as Float32Array;
      const originalPositions = system.userData.originalPositions as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        // Apply parallax offset based on camera movement
        positions[i] = originalPositions[i] - cameraMovement.x * speed;
        positions[i + 1] = originalPositions[i + 1] - cameraMovement.y * speed;
        positions[i + 2] = originalPositions[i + 2] - cameraMovement.z * speed;
      }

      system.geometry.attributes.position.needsUpdate = true;

      // Reposition particles that move too far from camera
      this.repositionDistantParticles(system, index);
    });

    this.lastCameraPosition.copy(this.camera.position);
  }

  private repositionDistantParticles(system: THREE.Points, layerIndex: number): void {
    const positions = system.geometry.attributes.position.array as Float32Array;
    const colors = system.geometry.attributes.color.array as Float32Array;
    const sizes = system.geometry.attributes.size.array as Float32Array;
    const originalPositions = system.userData.originalPositions as Float32Array;

    const maxDistance = 1000;
    const layers = [
      { distance: 800, size: 0.8, color: 0x88bbff },
      { distance: 600, size: 1.2, color: 0xaaccff },
      { distance: 400, size: 1.8, color: 0xccddff },
      { distance: 200, size: 2.5, color: 0xffffff }
    ];

    for (let i = 0; i < positions.length; i += 3) {
      const particlePos = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const distance = particlePos.distanceTo(this.camera.position);

      if (distance > maxDistance) {
        // Reposition particle in a sphere around the camera
        const layer = layers[layerIndex];
        const radius = layer.distance + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const newPos = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );

        newPos.add(this.camera.position);

        positions[i] = newPos.x;
        positions[i + 1] = newPos.y;
        positions[i + 2] = newPos.z;

        // Update original positions for parallax calculation
        originalPositions[i] = newPos.x;
        originalPositions[i + 1] = newPos.y;
        originalPositions[i + 2] = newPos.z;

        // Much brighter randomized color and size
        const brightness = 0.7 + Math.random() * 0.8; // Brighter range
        const color = new THREE.Color(layer.color);
        color.multiplyScalar(brightness);

        colors[i / 3 * 3] = color.r;
        colors[i / 3 * 3 + 1] = color.g;
        colors[i / 3 * 3 + 2] = color.b;

        sizes[i / 3] = layer.size * (0.8 + Math.random() * 0.7); // Larger sizes
      }
    }

    system.geometry.attributes.color.needsUpdate = true;
    system.geometry.attributes.size.needsUpdate = true;
  }

  dispose(): void {
    this.particleSystems.forEach(system => {
      this.scene.remove(system);
      system.geometry.dispose();
      (system.material as THREE.Material).dispose();
    });
    this.particleSystems = [];
  }
}