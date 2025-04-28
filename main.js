// Importaciones (usamos solo UNPKG correctamente)
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Función para crear la escena básica

// import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
// import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js';

// Clases y configuración principal
class SimpsonScene {
  constructor() {
    // Propiedades principales
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Colección de objetos para gestionar el rendimiento
    this.objects = {
      visibles: [],
      background: []
    };
    
    // Configuración de la cámara y rutas
    this.cameraSettings = {
      cameraPath: [
        { position: new THREE.Vector3(15, 8, 15), lookAt: new THREE.Vector3(0, 0, 0) },
        { position: new THREE.Vector3(0, 10, 20), lookAt: new THREE.Vector3(0, 5, 0) },
        { position: new THREE.Vector3(-15, 5, 10), lookAt: new THREE.Vector3(0, 3, 0) },
        { position: new THREE.Vector3(0, 5, -10), lookAt: new THREE.Vector3(0, 5, 5) }
      ],
      currentPoint: 0,
      progress: 0,
      speed: 0.005,
      angle: 0,
      radius: 20,
      center: new THREE.Vector3(0, 5, 0)
    };

    // Color palette for Simpson style
    this.colors = {
      sky: 0x87CEEB,
      grass: 0x7ec850,
      houseWall: 0xF5DEB3,
      roof: 0x8B0000,
      fence: 0x8B4513,
      trunk: 0x8B4513,
      leaves: 0x228B22,
      cloud: 0xFFFFFF
    };
    
    // Inicializar componentes
    this.init();
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createControls();
    this.createLights();
    this.createEnvironment();
    this.createHouse();
    this.createTrees();
    this.createDecorations();
    this.setupEventListeners();
    this.animate();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.colors.sky);
    
    // Para mejorar el rendimiento, creamos un objeto para almacenar cache
    this.textureLoader = new THREE.TextureLoader();
    this.geometryCache = {};
    this.materialCache = {};
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(10, 8, 15);
    this.camera.lookAt(0, 0, 0);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras más suaves
    
    // Optimizaciones del renderer
    this.renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);
  }

  createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI * 0.9;
  }

  createLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Optimización de las sombras
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    
    this.scene.add(directionalLight);
    this.directionalLight = directionalLight;
  }

  createEnvironment() {
    this.createGround();
    this.createFence();
    this.createClouds();
  }

  createGround() {
    // Patio con césped
    const groundGeometry = this.getGeometry('ground', () => new THREE.PlaneGeometry(50, 30, 32, 32));
    const groundMaterial = this.getMaterial('ground', () => 
      new THREE.MeshLambertMaterial({ color: this.colors.grass })
    );
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.objects.visibles.push(ground);
  }

  createFence() {
    // Valla trasera
    const fenceGeometry = this.getGeometry('fence', () => new THREE.BoxGeometry(50, 3, 0.2));
    const fenceMaterial = this.getMaterial('fence', () => 
      new THREE.MeshLambertMaterial({ color: this.colors.fence })
    );
    
    const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
    fence.position.set(0, 1.5, -15);
    fence.castShadow = true;
    fence.receiveShadow = true;
    this.scene.add(fence);
    this.objects.visibles.push(fence);
  }

  createHouse() {
    // Grupo para la casa completa
    const houseGroup = new THREE.Group();
    
    // Cuerpo principal de la casa
    const houseGeometry = this.getGeometry('house', () => new THREE.BoxGeometry(12, 8, 8));
    const houseMaterial = this.getMaterial('house', () => 
      new THREE.MeshLambertMaterial({ color: this.colors.houseWall })
    );
    
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.castShadow = true;
    house.receiveShadow = true;
    houseGroup.add(house);

    // Techo de la casa
    const roofGeometry = this.getGeometry('roof', () => new THREE.ConeGeometry(8, 4, 4));
    const roofMaterial = this.getMaterial('roof', () => 
      new THREE.MeshLambertMaterial({ color: this.colors.roof })
    );
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 6;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Añadir ventanas
    this.addWindows(houseGroup);

    // Añadir puerta
    this.addDoor(houseGroup);

    // Posicionar la casa completa
    houseGroup.position.set(-8, 4, 5);
    this.scene.add(houseGroup);
    this.objects.visibles.push(houseGroup);
  }

  addWindows(houseGroup) {
    // Material para las ventanas
    const windowMaterial = this.getMaterial('window', () => 
      new THREE.MeshLambertMaterial({ color: 0x87CEEB })
    );
    
    // Ventana frontal
    const frontWindowGeometry = this.getGeometry('frontWindow', () => new THREE.BoxGeometry(2, 2, 0.1));
    const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    frontWindow.position.set(0, 1, 4.01);
    houseGroup.add(frontWindow);
    
    // Ventana lateral
    const sideWindowGeometry = this.getGeometry('sideWindow', () => new THREE.BoxGeometry(0.1, 2, 2));
    const sideWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    sideWindow.position.set(6.01, 1, 0);
    houseGroup.add(sideWindow);
  }

  addDoor(houseGroup) {
    // Material para la puerta
    const doorMaterial = this.getMaterial('door', () => 
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    
    // Puerta
    const doorGeometry = this.getGeometry('door', () => new THREE.BoxGeometry(2, 4, 0.1));
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-3, -1, 4.01);
    houseGroup.add(door);
  }

  createTrees() {
    // Posiciones para varios árboles
    const treePositions = [
      { x: 10, y: 0, z: 0 },
      { x: 15, y: 0, z: 7 },
      { x: 8, y: 0, z: -7 }
    ];
    
    treePositions.forEach(pos => {
      this.createTree(pos.x, pos.y, pos.z);
    });
  }

  createTree(x, y, z) {
    // Grupo para el árbol completo
    const treeGroup = new THREE.Group();
    
    // Tronco
    const trunkGeometry = this.getGeometry('trunk', () => new THREE.CylinderGeometry(0.5, 0.5, 4, 8));
    const trunkMaterial = this.getMaterial('trunk', () => 
      new THREE.MeshLambertMaterial({ color: this.colors.trunk })
    );
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Hojas
    const leavesGeometry = this.getGeometry('leaves', () => new THREE.SphereGeometry(3, 16, 16));
    const leavesMaterial = this.getMaterial('leaves', () => 
      new THREE.MeshLambertMaterial({ color: this.colors.leaves })
    );
    
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 5;
    leaves.castShadow = true;
    treeGroup.add(leaves);
    
    // Posicionar el árbol completo
    treeGroup.position.set(x, y, z);
    this.scene.add(treeGroup);
    this.objects.visibles.push(treeGroup);
  }

  createClouds() {
    // Varias nubes en diferentes posiciones
    const cloudPositions = [
      { x: 5, y: 12, z: -10 },
      { x: -10, y: 15, z: -12 },
      { x: 15, y: 11, z: -8 }
    ];
    
    cloudPositions.forEach(pos => {
      this.createCloud(pos.x, pos.y, pos.z);
    });
  }

  createCloud(x, y, z) {
    // Grupo para la nube completa
    const cloudGroup = new THREE.Group();
    
    // Geometría y material para las partes de la nube
    const cloudGeometry = this.getGeometry('cloud', () => new THREE.SphereGeometry(1, 8, 8));
    const cloudMaterial = this.getMaterial('cloud', () => 
      new THREE.MeshLambertMaterial({ color: this.colors.cloud })
    );
    
    // Crear las esferas que forman la nube
    const positions = [
      { x: 0, y: 0, z: 0 },
      { x: 1.5, y: -0.5, z: 0 },
      { x: -1.5, y: -0.5, z: 0 },
      { x: 0.7, y: 0.7, z: 0 },
      { x: -0.7, y: 0.7, z: 0 }
    ];
    
    positions.forEach(pos => {
      const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloudPart.position.set(pos.x, pos.y, pos.z);
      cloudGroup.add(cloudPart);
    });
    
    // Posicionar la nube completa
    cloudGroup.position.set(x, y, z);
    this.scene.add(cloudGroup);
    this.objects.background.push(cloudGroup);
  }

  createDecorations() {
    // Implementación futura para añadir elementos decorativos
    // como buzón, garaje, etc.
  }

  setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Ejemplo de listener para detectar clicks en objetos
    window.addEventListener('click', this.onMouseClick.bind(this));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseClick(event) {
    // Implementación futura para detectar clicks en objetos
    // Útil para interacción con elementos del patio
  }

  // Sistema de caché para geometrías y materiales
  getGeometry(key, createFunc) {
    if (!this.geometryCache[key]) {
      this.geometryCache[key] = createFunc();
    }
    return this.geometryCache[key];
  }

  getMaterial(key, createFunc) {
    if (!this.materialCache[key]) {
      this.materialCache[key] = createFunc();
    }
    return this.materialCache[key];
  }

  // Métodos para la ruta de cámara
  updateCameraPath() {
    const settings = this.cameraSettings;
    
    if (settings.progress < 1) {
      settings.progress += settings.speed;
      const nextPoint = (settings.currentPoint + 1) % settings.cameraPath.length;

      // Interpolación suave entre puntos
      this.camera.position.lerpVectors(
        settings.cameraPath[settings.currentPoint].position,
        settings.cameraPath[nextPoint].position,
        settings.progress
      );

      // Interpolación de la mirada
      const target = new THREE.Vector3().lerpVectors(
        settings.cameraPath[settings.currentPoint].lookAt,
        settings.cameraPath[nextPoint].lookAt,
        settings.progress
      );
      this.camera.lookAt(target);
    } else {
      settings.currentPoint = (settings.currentPoint + 1) % settings.cameraPath.length;
      settings.progress = 0;
    }
  }

  updateCircularCamera() {
    const settings = this.cameraSettings;
    settings.angle += 0.002;
    
    this.camera.position.x = settings.center.x + Math.cos(settings.angle) * settings.radius;
    this.camera.position.z = settings.center.z + Math.sin(settings.angle) * settings.radius;
    this.camera.lookAt(settings.center);
  }

  // Técnica para mejorar rendimiento: Frustum culling
  updateVisibility() {
    // Crear un frustum para verificar qué objetos están en el campo de visión
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);
    
    // Verificar objetos visibles y actualizar su visibilidad
    [...this.objects.visibles, ...this.objects.background].forEach(object => {
      // Usamos una esfera de referencia para simplificar el cálculo
      if (!object.boundingSphere) {
        if (object.geometry) {
          object.geometry.computeBoundingSphere();
          object.boundingSphere = object.geometry.boundingSphere;
        } else {
          // Para grupos, usamos una esfera aproximada
          object.boundingSphere = new THREE.Sphere(object.position, 10);
        }
      }
      
      // Comprobar si está en el frustum
      const isVisible = frustum.intersectsSphere(object.boundingSphere);
      
      // Solo renderizar si está en el campo de visión
      if (object.visible !== isVisible) {
        object.visible = isVisible;
      }
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Elegir un tipo de movimiento de cámara (comentar uno u otro para cambiar)
    this.updateCameraPath();
    // this.updateCircularCamera();
    
    // Optimización: solo actualizar los controles si se están usando
    if (this.controls.enabled) {
      this.controls.update();
    }
    
    // Optimización: actualizar qué objetos son visibles y cuáles no
    this.updateVisibility();
    
    // Renderizar la escena
    this.renderer.render(this.scene, this.camera);
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const simpsonPatio = new SimpsonScene();
});