// Importaciones (usamos solo UNPKG correctamente)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Clases y configuración principal
class EscenaSimpson {
  constructor() {
    // Propiedades principales
    this.escena = null;
    this.camara = null;
    this.renderizador = null;
    this.controles = null;
    
    // Colección de objetos para gestionar el rendimiento
    this.objetos = {
      visibles: [],
      fondo: []
    };
    
    // Configuración de la cámara y rutas
    this.configuracionCamara = {
      rutaCamara: [
        { posicion: new THREE.Vector3(15, 8, 15), mirarA: new THREE.Vector3(0, 0, 0) },
        { posicion: new THREE.Vector3(0, 10, 20), mirarA: new THREE.Vector3(0, 5, 0) },
        { posicion: new THREE.Vector3(-15, 5, 10), mirarA: new THREE.Vector3(0, 3, 0) },
        { posicion: new THREE.Vector3(0, 5, -10), mirarA: new THREE.Vector3(0, 5, 5) }
      ],
      puntoActual: 0,
      progreso: 0,
      velocidad: 0.005,
      angulo: 0,
      radio: 20,
      centro: new THREE.Vector3(0, 5, 0)
    };

    // Paleta de colores para el estilo Simpson
    this.colores = {
      cielo: 0x87CEEB,
      cesped: 0x7ec850,
      paredCasa: 0xF5DEB3,
      techo: 0x8B0000,
      cerca: 0x8B4513,
      tronco: 0x8B4513,
      hojas: 0x228B22,
      nube: 0xFFFFFF
    };
    
    // Inicializar componentes
    this.inicializar();
  }

  inicializar() {
    this.crearEscena();
    this.crearCamara();
    this.crearRenderizador();
    this.crearControles();
    this.crearLuces();
    this.crearEntorno();
    this.crearCasa();
    this.crearArboles();
    this.crearDecoraciones();
    this.configurarEventListeners();
    this.animar();
  }

  crearEscena() {
    this.escena = new THREE.Scene();
    this.escena.background = new THREE.Color(this.colores.cielo);
    
    // Para mejorar el rendimiento, creamos un objeto para almacenar cache
    this.cargadorTexturas = new THREE.TextureLoader();
    this.cacheGeometrias = {};
    this.cacheMateriales = {};
  }

  crearCamara() {
    this.camara = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camara.position.set(10, 8, 15);
    this.camara.lookAt(0, 0, 0);
  }

  crearRenderizador() {
    this.renderizador = new THREE.WebGLRenderer({ antialias: true });
    this.renderizador.setSize(window.innerWidth, window.innerHeight);
    this.renderizador.shadowMap.enabled = true;
    this.renderizador.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras más suaves
    
    // Optimizaciones del renderizador
    this.renderizador.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    
    // Asegúrate de que el contenedor existe
    const container = document.getElementById('canvas-container');
    if (!container) {
      console.error('No se pudo encontrar el elemento "canvas-container". Creando uno nuevo.');
      const newContainer = document.createElement('div');
      newContainer.id = 'canvas-container';
      document.body.appendChild(newContainer);
      newContainer.appendChild(this.renderizador.domElement);
    } else {
      container.appendChild(this.renderizador.domElement);
    }
  }

  crearControles() {
    this.controles = new OrbitControls(this.camara, this.renderizador.domElement);
    this.controles.enableDamping = true;
    this.controles.dampingFactor = 0.05;
    this.controles.screenSpacePanning = false;
    this.controles.minDistance = 5;
    this.controles.maxDistance = 30;
    this.controles.maxPolarAngle = Math.PI * 0.9;
  }

  crearLuces() {
    // Luz ambiental
    const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.6);
    this.escena.add(luzAmbiental);

    // Luz direccional (sol)
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.8);
    luzDireccional.position.set(10, 20, 10);
    luzDireccional.castShadow = true;
    
    // Optimización de las sombras
    luzDireccional.shadow.mapSize.width = 2048;
    luzDireccional.shadow.mapSize.height = 2048;
    luzDireccional.shadow.camera.near = 0.5;
    luzDireccional.shadow.camera.far = 50;
    luzDireccional.shadow.camera.left = -20;
    luzDireccional.shadow.camera.right = 20;
    luzDireccional.shadow.camera.top = 20;
    luzDireccional.shadow.camera.bottom = -20;
    
    this.escena.add(luzDireccional);
    this.luzDireccional = luzDireccional;
  }

  crearEntorno() {
    this.crearSuelo();
    this.crearCerca();
    this.crearNubes();
  }

  crearSuelo() {
    // Patio con césped
    const geometriaSuelo = this.obtenerGeometria('suelo', () => new THREE.PlaneGeometry(50, 30, 32, 32));
    const materialSuelo = this.obtenerMaterial('suelo', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.cesped })
    );
    
    const suelo = new THREE.Mesh(geometriaSuelo, materialSuelo);
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    this.escena.add(suelo);
    this.objetos.visibles.push(suelo);
  }

  crearCerca() {
    const geometriaCerca = this.obtenerGeometria('cerca', () => new THREE.BoxGeometry(50, 3, 0.2));
    const geometriaCercaderecha = this.obtenerGeometria('cercaDerecha', () => new THREE.BoxGeometry(30, 3, 0.2));
    const materialCerca = this.obtenerMaterial('cerca', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.cerca })
    );

    // Valla derecha (alineada en eje Z)
    const cercaDerecha = new THREE.Mesh(geometriaCercaderecha, materialCerca);
    cercaDerecha.rotation.y = Math.PI / 2; // Rota 90 grados para que esté de lado
    cercaDerecha.position.set(25, 1.5, 0); // Ajusta la posición al borde derecho
    cercaDerecha.castShadow = true;
    cercaDerecha.receiveShadow = true;
    this.escena.add(cercaDerecha);
    this.objetos.visibles.push(cercaDerecha);

    // Valla izquierda
    const cercaIzquierda = new THREE.Mesh(geometriaCercaderecha, materialCerca);
    cercaIzquierda.rotation.y = -Math.PI / 2; // Rota 90 grados para que esté de lado
    cercaIzquierda.position.set(-25, 1.5, 0); // Ajusta la posición al borde izquierdo
    cercaIzquierda.castShadow = true;
    cercaIzquierda.receiveShadow = true;
    this.escena.add(cercaIzquierda);
    this.objetos.visibles.push(cercaIzquierda);

    // Valla trasera
    const cerca = new THREE.Mesh(geometriaCerca, materialCerca);
    cerca.position.set(0, 1.5, -15);
    cerca.castShadow = true;
    cerca.receiveShadow = true;
    this.escena.add(cerca);
    this.objetos.visibles.push(cerca);

    // Valla delantera
    const cerca2 = new THREE.Mesh(geometriaCerca, materialCerca);
    cerca2.position.set(0, 1.5, 15);
    cerca2.castShadow = true;
    cerca2.receiveShadow = true;
    this.escena.add(cerca2);
    this.objetos.visibles.push(cerca2);
  }

  crearCasa() {
    // Grupo para la casa completa
    const grupoCasa = new THREE.Group();
    
    // Cuerpo principal de la casa
    const geometriaCasa = this.obtenerGeometria('casa', () => new THREE.BoxGeometry(15, 10, 10));
    const geometriaCoplemento = this.obtenerGeometria('casaBase', () => new THREE.BoxGeometry(10, 10, 6));
    const materialCasa = this.obtenerMaterial('casa', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.paredCasa })
    );
    
    const casa = new THREE.Mesh(geometriaCasa, materialCasa);
    casa.position.set(0, 0, 0); // Posición relativa al grupo
    casa.castShadow = true;
    casa.receiveShadow = true;
    grupoCasa.add(casa);
    
    // Complemento de la casa
    const casaBase = new THREE.Mesh(geometriaCoplemento, materialCasa);
    casaBase.position.set(-10, 0, 2); // Posición relativa al grupo
    casaBase.castShadow = true;
    casaBase.receiveShadow = true;
    grupoCasa.add(casaBase);

    // Techo de la casa
    const geometriaTechomini = this.obtenerGeometria('techomini', () => new THREE.ConeGeometry(11.9, 5, 4));

    const geometriaTecho = this.obtenerGeometria('techo', () => new THREE.ConeGeometry(11.9, 5, 4));
    const materialTecho = this.obtenerMaterial('techo', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.techo })
    );
    
    const techomini = new THREE.Mesh(geometriaTechomini, materialTecho);
    const techo = new THREE.Mesh(geometriaTecho, materialTecho);
    techo.position.y = 7.5; // Ajustado para situar correctamente sobre la casa
    techo.rotation.y = Math.PI / 4;
    techomini.position.y = 8.5;
    techomini.rotation.y = Math.PI / 4;
    techo.castShadow = true;
    techomini.castShadow = true;
    grupoCasa.add(techo,techomini);

    // Añadir ventanas
    this.anadirVentanas(grupoCasa);

    // Añadir puerta
    this.anadirPuerta(grupoCasa);

    // Posicionar la casa completa
    grupoCasa.position.set(8, 5, 9);
    this.escena.add(grupoCasa);
    this.objetos.visibles.push(grupoCasa);
  }

  anadirVentanas(grupoCasa) {
    // Material para las ventanas
    const materialVentana = this.obtenerMaterial('ventana', () => 
      new THREE.MeshLambertMaterial({ color: 0x87CEEB })
    );
    
    // Ventana frontal
    const geometriaVentanaFrontal = this.obtenerGeometria('ventanaFrontal', () => new THREE.BoxGeometry(2, 2, 0.1));
    const ventanaFrontal = new THREE.Mesh(geometriaVentanaFrontal, materialVentana);
    ventanaFrontal.position.set(0, 1, 5.01); // Ajustado para estar en la superficie
    grupoCasa.add(ventanaFrontal);
    
    // Ventana lateral
    const geometriaVentanaLateral = this.obtenerGeometria('ventanaLateral', () => new THREE.BoxGeometry(0.1, 2, 2));
    const ventanaLateral = new THREE.Mesh(geometriaVentanaLateral, materialVentana);
    ventanaLateral.position.set(7.51, 1, 0); // Ajustado para estar en la superficie
    grupoCasa.add(ventanaLateral);
  }

  anadirPuerta(grupoCasa) {
    // Material para la puerta
    const materialPuerta = this.obtenerMaterial('puerta', () => 
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    
    // Puerta
    const geometriaPuerta = this.obtenerGeometria('puerta', () => new THREE.BoxGeometry(2, 4, 0.1));
    const puerta = new THREE.Mesh(geometriaPuerta, materialPuerta);
    puerta.position.set(-3, -1, 5.01); // Ajustado para estar en la superficie
    grupoCasa.add(puerta);
  }

  crearArboles() {
    // Posiciones para varios árboles
    const posicionArbolGrande = [{ x:8, y: 0, z: 0 }]

    const posicionesArboles = [
      { x: -21, y: 0, z: 7 },
      { x: -20, y: 0, z: -7 }
    ];
    
    posicionesArboles.forEach(pos => {
      this.crearArbol(pos.x, pos.y, pos.z);
    });


    posicionArbolGrande.forEach(pos => {
      this.casadelarbol(pos.x, pos.y, pos.z);
    })
  }
// Casa del arbol principal 
  casadelarbol(x,y,z){
     // Grupo para el árbol completo
    // const grupoArbol = new THREE.Group();
    const casadelarbol = new THREE.Group();
    
    // Tronco 
    const geometriaTronco = this.obtenerGeometria('palo', () => new THREE.CylinderGeometry(2, 2, 15, 10));
    const materialTronco = this.obtenerMaterial('palo', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.tronco })
    );
    
    const tronco = new THREE.Mesh(geometriaTronco, materialTronco);
    tronco.position.y = 2;
    // tronco.castShadow = true;
    casadelarbol.add(tronco);
    
    // Hojas
    const geometriaHojas = this.obtenerGeometria('hojas', () => new THREE.SphereGeometry(13, 26, 26));
    const materialHojas = this.obtenerMaterial('hojas', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.hojas })
    );
    
    const hojas = new THREE.Mesh(geometriaHojas, materialHojas);
    hojas.position.y = 5;
    hojas.castShadow = true;
    casadelarbol.add(hojas);
    
    // Posicionar el árbol completo
    casadelarbol.position.set(x, y, z);
    this.escena.add(casadelarbol);
    this.objetos.visibles.push(casadelarbol);
  }


  crearArbol(x, y, z) {
    // Grupo para el árbol completo
    const grupoArbol = new THREE.Group();
    
    // Tronco
    const geometriaTronco = this.obtenerGeometria('tronco', () => new THREE.CylinderGeometry(0.5, 0.5, 4, 8));
    const materialTronco = this.obtenerMaterial('tronco', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.tronco })
    );
    
    const tronco = new THREE.Mesh(geometriaTronco, materialTronco);
    tronco.position.y = 2;
    tronco.castShadow = true;
    grupoArbol.add(tronco);
    
    // Hojas
    const geometriaHojas = this.obtenerGeometria('hojas', () => new THREE.SphereGeometry(3, 16, 16));
    const materialHojas = this.obtenerMaterial('hojas', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.hojas })
    );
    
    const hojas = new THREE.Mesh(geometriaHojas, materialHojas);
    hojas.position.y = 5;
    hojas.castShadow = true;
    grupoArbol.add(hojas);
    
    // Posicionar el árbol completo
    grupoArbol.position.set(x, y, z);
    this.escena.add(grupoArbol);
    this.objetos.visibles.push(grupoArbol);
  }

  crearNubes() {
    // Varias nubes en diferentes posiciones
    const posicionesNubes = [
      { x: 5, y: 12, z: -10 },
      { x: -10, y: 15, z: -12 },
      { x: 15, y: 11, z: -8 }
    ];
    
    posicionesNubes.forEach(pos => {
      this.crearNube(pos.x, pos.y, pos.z);
    });
  }

  crearNube(x, y, z) {
    // Grupo para la nube completa
    const grupoNube = new THREE.Group();
    
    // Geometría y material para las partes de la nube
    const geometriaNube = this.obtenerGeometria('nube', () => new THREE.SphereGeometry(1, 8, 8));
    const materialNube = this.obtenerMaterial('nube', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.nube })
    );
    
    // Crear las esferas que forman la nube
    const posiciones = [
      { x: 0, y: 0, z: 0 },
      { x: 1.5, y: -0.5, z: 0 },
      { x: -1.5, y: -0.5, z: 0 },
      { x: 0.7, y: 0.7, z: 0 },
      { x: -0.7, y: 0.7, z: 0 }
    ];
    
    posiciones.forEach(pos => {
      const parteNube = new THREE.Mesh(geometriaNube, materialNube);
      parteNube.position.set(pos.x, pos.y, pos.z);
      grupoNube.add(parteNube);
    });
    
    // Posicionar la nube completa
    grupoNube.position.set(x, y, z);
    this.escena.add(grupoNube);
    this.objetos.fondo.push(grupoNube);
  }

  crearDecoraciones() {
    // Implementación futura para añadir elementos decorativos
    // como buzón, garaje, etc.
  }

  configurarEventListeners() {
    window.addEventListener('resize', this.alRedimensionarVentana.bind(this));
    
    // Ejemplo de listener para detectar clicks en objetos
    window.addEventListener('click', this.alHacerClicRaton.bind(this));
  }

  alRedimensionarVentana() {
    this.camara.aspect = window.innerWidth / window.innerHeight;
    this.camara.updateProjectionMatrix();
    this.renderizador.setSize(window.innerWidth, window.innerHeight);
  }

  alHacerClicRaton(event) {
    // Implementación futura para detectar clicks en objetos
    // Útil para interacción con elementos del patio
  }

  // Sistema de caché para geometrías y materiales
  obtenerGeometria(clave, funcionCreacion) {
    if (!this.cacheGeometrias[clave]) {
      this.cacheGeometrias[clave] = funcionCreacion();
    }
    return this.cacheGeometrias[clave];
  }

  obtenerMaterial(clave, funcionCreacion) {
    if (!this.cacheMateriales[clave]) {
      this.cacheMateriales[clave] = funcionCreacion();
    }
    return this.cacheMateriales[clave];
  }

  // Métodos para la ruta de cámara
  actualizarRutaCamara() {
    const config = this.configuracionCamara;
    
    if (config.progreso < 1) {
      config.progreso += config.velocidad;
      const siguientePunto = (config.puntoActual + 1) % config.rutaCamara.length;

      // Interpolación suave entre puntos
      this.camara.position.lerpVectors(
        config.rutaCamara[config.puntoActual].posicion,
        config.rutaCamara[siguientePunto].posicion,
        config.progreso
      );

      // Interpolación de la mirada
      const objetivo = new THREE.Vector3().lerpVectors(
        config.rutaCamara[config.puntoActual].mirarA,
        config.rutaCamara[siguientePunto].mirarA,
        config.progreso
      );
      this.camara.lookAt(objetivo);
    } else {
      config.puntoActual = (config.puntoActual + 1) % config.rutaCamara.length;
      config.progreso = 0;
    }
  }

  actualizarCamaraCircular() {
    const config = this.configuracionCamara;
    config.angulo += 0.002;
    
    this.camara.position.x = config.centro.x + Math.cos(config.angulo) * config.radio;
    this.camara.position.z = config.centro.z + Math.sin(config.angulo) * config.radio;
    this.camara.lookAt(config.centro);
  }

  // Técnica para mejorar rendimiento: Frustum culling
  actualizarVisibilidad() {
    // Crear un frustum para verificar qué objetos están en el campo de visión
    const frustum = new THREE.Frustum();
    const matriz = new THREE.Matrix4().multiplyMatrices(
      this.camara.projectionMatrix,
      this.camara.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matriz);
    
    // Verificar objetos visibles y actualizar su visibilidad
    [...this.objetos.visibles, ...this.objetos.fondo].forEach(objeto => {
      // Usamos una esfera de referencia para simplificar el cálculo
      if (!objeto.boundingSphere) {
        if (objeto.geometry) {
          objeto.geometry.computeBoundingSphere();
          objeto.boundingSphere = objeto.geometry.boundingSphere;
        } else {
          // Para grupos, usamos una esfera aproximada
          objeto.boundingSphere = new THREE.Sphere(objeto.position, 10);
        }
      }
      
      // Comprobar si está en el frustum
      const esVisible = frustum.intersectsSphere(objeto.boundingSphere);
      
      // Solo renderizar si está en el campo de visión
      if (objeto.visible !== esVisible) {
        objeto.visible = esVisible;
      }
    });
  }

  animar() {
    requestAnimationFrame(this.animar.bind(this));
    
    // Elegir un tipo de movimiento de cámara (descomentar uno para activarlo)
    // this.actualizarRutaCamara();
    // this.actualizarCamaraCircular(); // Activando movimiento circular por defecto
    
    // Optimización: solo actualizar los controles si se están usando
    if (this.controles.enabled) {
      this.controles.update();
    }
    
    // Optimización: actualizar qué objetos son visibles y cuáles no
    this.actualizarVisibilidad();
    
    // Renderizar la escena
    this.renderizador.render(this.escena, this.camara);
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const patioSimpson = new EscenaSimpson();
});