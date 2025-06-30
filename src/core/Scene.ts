import * as THREE from 'three';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement) {
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer(container);
    this.setupLighting();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    // Lighter background for better contrast
    scene.background = new THREE.Color(0x001122);
    scene.fog = new THREE.Fog(0x001122, 100, 500);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Set camera to start at the correct follow position (ball starts at 0, 80, 0)
    // Camera offset is (0, 10, 20), so camera should start at (0, 90, 20)
    camera.position.set(0, 90, 20);
    
    // Point camera at ball's starting position
    camera.lookAt(0, 80, 0);
    
    return camera;
  }

  private createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Enhanced renderer settings for better glow effects
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.appendChild(renderer.domElement);
    return renderer;
  }

  private setupLighting(): void {
    // Brighter ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404080, 0.6);
    this.scene.add(ambientLight);

    // Enhanced directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);

    // Add additional point lights for better illumination
    const pointLight1 = new THREE.PointLight(0x4488ff, 0.5, 200);
    pointLight1.position.set(50, 50, 50);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff4488, 0.5, 200);
    pointLight2.position.set(-50, 50, -50);
    this.scene.add(pointLight2);

    // Add hemisphere light for overall brightness
    const hemisphereLight = new THREE.HemisphereLight(0x4488ff, 0x002244, 0.4);
    this.scene.add(hemisphereLight);
  }

  updateCamera(ballPosition: THREE.Vector3): void {
    const cameraOffset = new THREE.Vector3(0, 10, 20);
    const targetPosition = ballPosition.clone().add(cameraOffset);
    this.camera.position.lerp(targetPosition, 0.1);
    this.camera.lookAt(ballPosition);
  }

  handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}