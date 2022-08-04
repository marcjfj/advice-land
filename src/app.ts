import {
  WebGLRenderer,
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  sRGBEncoding,
  Vector3,
  PerspectiveCamera,
  AmbientLight,
  PointLight,
  TextureLoader,
  PlaneGeometry,
  MeshPhongMaterial,
  Mesh,
  DoubleSide,
  Quaternion,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
  AnimationClip,
  AnimationMixer,
  Clock,
  LoopOnce,
  Vector2,
} from 'three';

import {
  loadModel,
  isChildOf,
} from './utils';

import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {Text} from 'troika-three-text'

// RENDERER
export const setupRenderer = () => {
  const renderer = new WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.outputEncoding = sRGBEncoding;
  return renderer;
}

// CAMERA
export const setupCamera = () => {
  const camera = new PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.set( 10, 20, 15 );
  camera.lookAt(new Vector3(0,0,5))
  return camera;
}

// ORBIT CONTROLS
export const setupOrbitControls = (camera:THREE.Camera, renderer:THREE.Renderer) => {
  const controls = new OrbitControls( camera, renderer.domElement );
  controls.minDistance = 0;
  controls.maxDistance = 25;
  controls.target.set( 0, 0, -5 );
  controls.update();
  return controls;
}

// LIGHTS
export const setupLights = (scene:THREE.Scene) => {
  const ambientLight = new AmbientLight( 0xcccccc, 0.55 );
  scene.add( ambientLight );

  const pointLight = new PointLight( 0xffffff, 1.5 );
  pointLight.position.set( 2, 5, 4 );
  pointLight.castShadow = true;
  scene.add( pointLight );

  return {ambientLight, pointLight};
}

// WALLS
export const setupFloorAndWalls = (scene:THREE.Scene) => {
  const floorGeometry = new PlaneGeometry( 20, 20 );
  // const floorMaterial = new MeshBasicMaterial( {color: 0xffff00, side: DoubleSide} );
  const texture = new TextureLoader().load( "/old-cement-wall-texture.jpg" );

  var material = new MeshPhongMaterial({ transparent: false, map: texture});
  material.side = DoubleSide;
  const floorPlane = new Mesh( floorGeometry, material );
  floorPlane.receiveShadow = true;
  floorPlane.rotateX(-Math.PI/2);
  floorPlane.position.set(0,-0.48,5);
  scene.add( floorPlane );

  const wallGeometry = new PlaneGeometry( 10, 20 );
  const wallPlane = new Mesh( wallGeometry, material );
  wallPlane.rotateZ(Math.PI/2);
  wallPlane.position.set(0, 4.5, -5);
  wallPlane.receiveShadow = true;
  scene.add( wallPlane );

  return [wallPlane, floorPlane];
}

// TABLE
export const setupTable = async (scene:THREE.Scene) => {
  const loader = new GLTFLoader().setPath( '/table/' );
  const gltf:GLTF = await loadModel(loader, 'scene.gltf');
  gltf.scene.traverse( function( node ) {
    console.log(node.type);
    if ( node.type === 'Mesh' ) { node.castShadow = true; node.receiveShadow = true }
  });

  gltf.scene.rotateY(Math.PI/2);
  gltf.scene.name = 'TABLE';

  scene.add(gltf.scene);
  return gltf.scene;
}

// DICE
export const setupDice = async (scene:THREE.Scene) => {
  const diceLoader = new GLTFLoader().setPath( '/dice/' );
  const gltf:GLTF = await loadModel(diceLoader, 'scene.gltf');

  // const gltf = await diceLoader.load('scene.gltf', undefined, undefined, (err) => console.log(err));
  gltf.scene.traverse( function( node:THREE.Object3D ) {
    if ( node.type === 'Mesh' ) { node.castShadow = true; node.receiveShadow = true }
  });

  gltf.scene.scale.set(.005,.005,.005);
  gltf.scene.position.set(0,0.475,0);
  gltf.scene.name = 'DIE_SCENE';
  scene.add(gltf.scene);
  return gltf.scene;
}

// DICE ANIMATION
let numberOfRolls = 0;
export const diceAnimation = (scene:THREE.Scene, dice:THREE.Group) => {
  const xAxis = new Vector3( 1, 0, 0 );
  const yAxis = new Vector3( 0, 1, 0 );
  const qInitial = new Quaternion().setFromAxisAngle( xAxis, 0 );
  const qFinal = new Quaternion().setFromAxisAngle( xAxis, Math.PI );
  const q2Initial = new Quaternion().setFromAxisAngle( yAxis, 0 );
  const q2Final = new Quaternion().setFromAxisAngle( yAxis, Math.PI );
  const xQuaternionKF = new QuaternionKeyframeTrack( '.quaternion', [ 0, 1 ], [ qInitial.x, qInitial.y, qInitial.z, qInitial.w, qFinal.x, qFinal.y, qFinal.z, qFinal.w] );
  const yQuaternionKF = new QuaternionKeyframeTrack( '.quaternion', [ 0, 1 ], [ q2Initial.x, q2Initial.y, q2Initial.z, q2Initial.w, q2Final.x, q2Final.y, q2Final.z, q2Final.w] );
  const positionKF = new VectorKeyframeTrack( '.position', [ 0, .5, 1 ], [ 0, 0.475, 0, 0, 2, 0, 0, 0.575, 0 ] );
  const clip = new AnimationClip( 'Action', 1, [ xQuaternionKF, yQuaternionKF, positionKF ] );

  const mixer = new AnimationMixer( dice );
  const clock = new Clock();

  const clipAction = mixer.clipAction( clip );
  clipAction.setLoop( LoopOnce, 0 );
  clipAction.clampWhenFinished = true;
  const playDiceRoll = () => {
    if (numberOfRolls % 2 === 0) {
      clipAction.timeScale = 1;
      clipAction.reset().play();
    }
    else {
      clipAction.timeScale = -1;
      clipAction.paused = false;
    };
    numberOfRolls++;
  };

  return {mixer, clock, clip, playDiceRoll};
}

// CHALKBOARD
export const setupChalkboard = async (scene:THREE.Scene) => {
  const loader = new GLTFLoader().setPath( '/chalkboard/' );
  const gltf:GLTF = await loadModel(loader, 'scene.gltf');
  gltf.scene.traverse( function( node ) {
    if ( node.type === 'Mesh' ) { 
      node.castShadow = true;
      node.receiveShadow = true
    }
  });
  gltf.scene.scale.set(1,1,1);
  gltf.scene.position.set(0,-0.65,-2);
  scene.add(gltf.scene);
  return gltf.scene;
}

// TEXT
export const setupText = async (scene:THREE.Scene) => {
  const text = new Text();
  scene.add(text);
  text.text = 'Roll the die!';
  text.fontSize = 0.2;
  text.position.set(0,2.5,-1.75);
  text.rotateY(Math.PI/50);
  text.maxWidth = 3;
  text.width = 3;
  text.color = 0xffffff;
  text.font = '/Shadows_Into_Light/ShadowsIntoLight-Regular.ttf';
  text.anchorX = 'center';
  text.textAlign = 'center';
  return text;
}

// POINTER
export const setupPointer = () => {
  const pointer = new Vector2();
  
  document.addEventListener( 'mousemove', onPointerMove );
  
  function onPointerMove( event:MouseEvent ) {
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  
  }
  
  return pointer;
  
}

// CLICK HANDLER
export const setupClickHandler = (scene:THREE.Scene, pointer:THREE.Vec2, camera:THREE.Camera, raycaster:THREE.Raycaster, clickCallback:()=>void ) => {
  document.addEventListener('click', async (e) => {
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      if (isChildOf('DIE', intersects[0].object)) {
        clickCallback();
      }
    }
  })
}

// REQUEST HANDLER
export const fetchAdvice = async () => {
  const request = await fetch('https://api.adviceslip.com/advice', {
    cache: 'no-cache',
  });
  const response = await request.json();
  return response.slip.advice;
}

// MOUSEOVER HANDLER
export const intersectionWatcher = (query:string, intersected:any[]) => {
  if ( intersected.length > 0 ) {
    if (isChildOf('DIE', intersected[ 0 ].object)) {
     document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
  }
  
  return null;
  
}

// RESIZE HANDLER
export const resizeHandler = (renderer:THREE.WebGLRenderer, camera:THREE.PerspectiveCamera, render:()=>void) => {
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  });
}