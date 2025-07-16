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
    const geometriaTechomini = this.obtenerGeometria('techomini', () => new THREE.ConeGeometry(8, 3, 4));

    const geometriaTecho = this.obtenerGeometria('techo', () => new THREE.ConeGeometry(11.9, 5, 4));
    const materialTecho = this.obtenerMaterial('techo', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.techo })
    );
    
    const techomini = new THREE.Mesh(geometriaTechomini, materialTecho);
    const techo = new THREE.Mesh(geometriaTecho, materialTecho);
    techo.position.y = 7.5; // Ajustado para situar correctamente sobre la casa
    techo.rotation.y = Math.PI / 4;
    techomini.position.y = 6.5;
    techomini.position.x = -11;
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

    // Ventana trasera atras del arbol 1
    const geometriaVentanatrasera = this.obtenerGeometria('ventanatrasera', () => new THREE.BoxGeometry(3, 3, 0.1));
    const ventanatrasera = new THREE.Mesh(geometriaVentanatrasera, materialVentana);
    ventanatrasera.position.set(4, 2.5, -5.01); // Ajustado para estar en la superficie
    grupoCasa.add(ventanatrasera);

    //ventana trasera 2
    const geometriaVentanatrasera2 = this.obtenerGeometria('ventanatrasera', () => new THREE.BoxGeometry(3, 3, 0.1));
    const ventanatrasera2 = new THREE.Mesh(geometriaVentanatrasera, materialVentana);
    ventanatrasera2.position.set(-3, 2.5, -5.01); // Ajustado para estar en la superficie
    grupoCasa.add(ventanatrasera2);

    const geometriaVentanatrasera3 = this.obtenerGeometria('ventanatrasera', () => new THREE.BoxGeometry(3, 3, 0.1));
    const ventanatrasera3 = new THREE.Mesh(geometriaVentanatrasera, materialVentana);
    ventanatrasera3.position.set(-3, -2, -5.01); // ventaba abajo 1
    grupoCasa.add(ventanatrasera3);

    const geometriaVentanatrasera4 = this.obtenerGeometria('ventanatrasera', () => new THREE.BoxGeometry(3, 3, 0.1));
    const ventanatrasera4 = new THREE.Mesh(geometriaVentanatrasera, materialVentana);
    ventanatrasera4.position.set(4, -2, -5.01); // ventaba abajo 2
    grupoCasa.add(ventanatrasera4);

   
  }
  
  agregarVentanas(casaBase){
    const materialVentana1 = this.obtenerMaterial('ventana', () => 
      new THREE.MeshLambertMaterial({ color: 0x87CEEB })
    );

    const geometriaVentana1 = this.obtenerGeometria('ventanaCasaBase', () => new THREE.BoxGeometry(4, 4, 0.1));
    const ventana1 = new THREE.Mesh(geometriaVentana1, materialVentana1);
    ventana1.position.set(-3, -2, -5.01); 
    casaBase.add(ventana1);


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
    const posicionArbolGrande = [{ x:11, y: 4, z: -6 }]

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
    const geometriaTronco = this.obtenerGeometria('palo', () => new THREE.CylinderGeometry(1.5, 2, 11, 13));
    const materialTronco = this.obtenerMaterial('palo', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.tronco })
    );
    
    const tronco = new THREE.Mesh(geometriaTronco, materialTronco);
    tronco.position.y = 0;
    tronco.position.z = -2;
    // tronco.castShadow = true;
    casadelarbol.add(tronco);
    
    // Hojas
    const geometriaHojas = this.obtenerGeometria('hojas_g', () => new THREE.SphereGeometry(4, 17,17));
    const materialHojas = this.obtenerMaterial('hojas_g', () => 
      new THREE.MeshLambertMaterial({ color: this.colores.hojas })
    );

      // Hojas mas pquenas
     const geometriaHojaspequenas = this.obtenerGeometria('ho', () => new THREE.SphereGeometry(2, 13,13));

    const minihoja = new THREE.Mesh(geometriaHojaspequenas,materialHojas);
    minihoja.position.y = 1;
    minihoja.position.x = -4;
    minihoja.position.z = -2;
    casadelarbol.add(minihoja)
    
    // hoas mas peuenas
    // No puedo escribir la j en la pc de escritorio

    const hoa1 = new THREE.Mesh(geometriaHojas, materialHojas);
    hoa1.position.y = 5;
    hoa1.position.x = 3;
    hoa1.position.z = -3;
    casadelarbol.add(hoa1)

    const hoa2 = new THREE.Mesh(geometriaHojas, materialHojas);
    hoa2.position.y = 5;
    hoa2.position.x = -5;
    hoa2.position.z = -5;
    casadelarbol.add(hoa2)

    const hojas = new THREE.Mesh(geometriaHojas, materialHojas);
    hojas.position.y = 3.7;
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

  crearCasaArbol() {
  // Grupo para la casa del árbol
  const grupoCasaArbol = new THREE.Group();
  
  // Base (plataforma) de la casa
  const geometriaBase = this.obtenerGeometria('base_casa_arbol', () => new THREE.BoxGeometry(6, 0.5, 5));
  const materialMadera = this.obtenerMaterial('madera_casa_arbol', () => 
    new THREE.MeshLambertMaterial({ color: 0x8B4513 }) // Marrón madera
  );
  
  const base = new THREE.Mesh(geometriaBase, materialMadera);
  base.castShadow = true;
  grupoCasaArbol.add(base);
  
  // Paredes de la casa
  const geometriaParedes = this.obtenerGeometria('paredes_casa_arbol', () => new THREE.BoxGeometry(5, 3,  4));
  const materialParedes = this.obtenerMaterial('paredes_casa_arbol', () => 
    new THREE.MeshLambertMaterial({ color: 0xCD853F }) // Marrón claro
  );
  
  const paredes = new THREE.Mesh(geometriaParedes, materialParedes);
  paredes.position.y = 1.75; // Mitad de la altura
  paredes.castShadow = true;
  grupoCasaArbol.add(paredes);
  
  // Techo de la casa
  const geometriaTecho = this.obtenerGeometria('techo_casa_arbol', () => new THREE.ConeGeometry(3.8, 2, 4));
  const materialTecho = this.obtenerMaterial('techo_casa_arbol', () => 
    new THREE.MeshLambertMaterial({ color: 0x8B0000 }) // Rojo oscuro
  );
  
  const techo = new THREE.Mesh(geometriaTecho, materialTecho);
  techo.position.y = 4.25; // Encima de las paredes
  techo.rotation.y = Math.PI / 4; // Girar 45 grados
  techo.castShadow = true;
  grupoCasaArbol.add(techo);
  
  // Ventana frontal
  const geometriaVentana = this.obtenerGeometria('ventana_casa_arbol', () => new THREE.BoxGeometry(1.5, 1.2, 0.1));
  const materialVentana = this.obtenerMaterial('ventana_casa_arbol', () => 
    new THREE.MeshLambertMaterial({ color: 0x87CEEB }) // Azul cielo
  );
  
  const ventana = new THREE.Mesh(geometriaVentana, materialVentana);
  ventana.position.set(0, 1.8, 2.01); // Frente de la casa
  grupoCasaArbol.add(ventana);
  
  // Puerta
  const geometriaPuerta = this.obtenerGeometria('puerta_casa_arbol', () => new THREE.BoxGeometry(1.2, 2, 0.1));
  const materialPuerta = this.obtenerMaterial('puerta_casa_arbol', () => 
    new THREE.MeshLambertMaterial({ color: 0x654321 }) // Marrón oscuro
  );
  
  const puerta = new THREE.Mesh(geometriaPuerta, materialPuerta);
  puerta.position.set(-1.5, 1.25, 2.01); // Frente de la casa
  grupoCasaArbol.add(puerta);
  
  // Escalera
  this.crearEscaleraCasaArbol(grupoCasaArbol);
  
  // Posicionar la casa completa en lo alto del árbol grande
  // Ajusta estas coordenadas para que coincidan con la parte superior del árbol grande
  grupoCasaArbol.position.set(10,11, -8);
  
  this.escena.add(grupoCasaArbol);
  this.objetos.visibles.push(grupoCasaArbol);
}

crearEscaleraCasaArbol(grupoCasaArbol) {
  const materialMadera = this.obtenerMaterial('madera_escalera', () => 
    new THREE.MeshLambertMaterial({ color: 0x8B4513 })
  );
  
  // Crear los peldaños de la escalera
  for (let i = 0; i < 5; i++) {
    const geometriaPeldano = this.obtenerGeometria('peldano_escalera', () => new THREE.BoxGeometry(1.5, 0.2, 0.4));
    const peldano = new THREE.Mesh(geometriaPeldano, materialMadera);
    
    // Posicionar cada peldaño en diagonal
    peldano.position.set(2 + i*0.3, -1 + i*0.5, 1.5 - i*0.3);
    peldano.rotation.z = Math.PI / 8; // Inclinación
    peldano.castShadow = true;
    peldano.position.x = -3.5;
    
    grupoCasaArbol.add(peldano);
  }
  
  // Añadir pasamanos
  const geometriaPasamanos = this.obtenerGeometria('pasamanos_escalera', () => new THREE.BoxGeometry(0.2, 3.5, 0.2));
  const pasamanos = new THREE.Mesh(geometriaPasamanos, materialMadera);
  
  pasamanos.position.set(4, 0.5, 0.5);
  pasamanos.rotation.z = Math.PI / 1; // Misma inclinación que los peldaños
  pasamanos.castShadow = true;
  pasamanos.position.x = -4;
  
  grupoCasaArbol.add(pasamanos);
}

crearBoteBasura() {
  // Grupo para el bote completo
  const grupoBote = new THREE.Group();
  
  // Cuerpo del bote
  const geometriaBote = this.obtenerGeometria('bote_basura', () => new THREE.CylinderGeometry(0.8, 0.6, 2, 12));
  const materialBote = this.obtenerMaterial('bote_basura', () => 
    new THREE.MeshLambertMaterial({ color: 0x808080 }) // Gris metálico
  );
  
  const bote = new THREE.Mesh(geometriaBote, materialBote);
  bote.position.y = 1; // Mitad de su altura
  bote.castShadow = true;
  grupoBote.add(bote);
  
  // Tapa del bote
  const geometriaTapa = this.obtenerGeometria('tapa_bote', () => new THREE.CylinderGeometry(0.85, 0.8, 0.2, 12));
  const materialTapa = this.obtenerMaterial('tapa_bote', () => 
    new THREE.MeshLambertMaterial({ color: 0x696969 }) // Gris oscuro
  );
  
  const tapa = new THREE.Mesh(geometriaTapa, materialTapa);
  tapa.position.y = 2.1; // Encima del bote
  tapa.castShadow = true;
  grupoBote.add(tapa);
  
  // Posicionar el bote completo
  grupoBote.position.set(-12, 0, 12); // Posición en el patio
  this.escena.add(grupoBote);
  this.objetos.visibles.push(grupoBote);
}

crearBuzon() {
  // Grupo para el buzón completo
  const grupoBuzon = new THREE.Group();
  
  // Poste del buzón
  const geometriaPoste = this.obtenerGeometria('poste_buzon', () => new THREE.BoxGeometry(0.5, 3, 0.5));
  const materialPoste = this.obtenerMaterial('poste_buzon', () => 
    new THREE.MeshLambertMaterial({ color: 0x8B4513 })
  );
  
  const poste = new THREE.Mesh(geometriaPoste, materialPoste);
  poste.position.y = 1.5; // Mitad de su altura
  poste.castShadow = true;
  grupoBuzon.add(poste);
  
  // Caja del buzón
  const geometriaCaja = this.obtenerGeometria('caja_buzon', () => new THREE.BoxGeometry(1.2, 0.8, 1.5));
  const materialCaja = this.obtenerMaterial('caja_buzon', () => 
    new THREE.MeshLambertMaterial({ color: 0x1E90FF }) // Azul al estilo Simpson
  );
  
  const caja = new THREE.Mesh(geometriaCaja, materialCaja);
  caja.position.y = 3; // Arriba del poste
  caja.castShadow = true;
  grupoBuzon.add(caja);
  
  // Bandera del buzón
  const geometriaBandera = this.obtenerGeometria('bandera_buzon', () => new THREE.BoxGeometry(0.1, 0.6, 0.1));
  const materialBandera = this.obtenerMaterial('bandera_buzon', () => 
    new THREE.MeshLambertMaterial({ color: 0xFF0000 }) // Rojo
  );
  
  const bandera = new THREE.Mesh(geometriaBandera, materialBandera);
  bandera.position.set(0.7, 3.2, 0.5); // Al lado derecho del buzón
  bandera.castShadow = true;
  grupoBuzon.add(bandera);
  
  // Posicionar el buzón completo
  grupoBuzon.position.set(17, 0, 12); // Posición cerca de la cerca
  this.escena.add(grupoBuzon);
  this.objetos.visibles.push(grupoBuzon);
}

  crearNubes() {
    // Varias nubes en diferentes posiciones
    const posicionesNubes = [
      { x: 0, y: 17, z: 4 },//la de enmedio
      { x: -15, y: 15, z: -6 },//la de la otra esquina primera
      { x: 19, y: 15, z: -8 } //lade la esquina cerca del arbol
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

  // cosas mas pequenas 
  crearDecoraciones() {
  this.crearBuzon();
  this.crearBoteBasura();
  this.crearCasaArbol();
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