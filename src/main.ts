import './style.css'
import * as THREE from 'three';
import {
  setupRenderer,
  setupCamera,
  setupOrbitControls,
  setupLights,
  setupFloorAndWalls,
  setupTable,
  setupDice,
  diceAnimation,
  setupChalkboard,
  setupText,
  setupPointer,
  setupClickHandler,
  fetchAdvice,
  intersectionWatcher,
  resizeHandler,
} from './app';

// init

const init = async () => {
  const camera = setupCamera();

  const scene = new THREE.Scene();

  const renderer = setupRenderer();
  document.body.appendChild( renderer.domElement );
  const render = () => {
    renderer.render(scene, camera);
  }

  
  setupOrbitControls(camera, renderer);
  setupLights(scene);
  setupFloorAndWalls(scene);
  setupTable(scene);
  setupChalkboard(scene);
  const pointer = setupPointer();
  const [dice, text] = await Promise.all([setupDice(scene), setupText(scene)]);
  const {mixer, clock, playDiceRoll} = diceAnimation(scene, dice);
  renderer.setAnimationLoop( animationLoop );

  const raycaster = new THREE.Raycaster();

  setupClickHandler(scene, pointer, camera, raycaster, async () => {
    playDiceRoll();
    text.text = await fetchAdvice();
  });
  
  function animationLoop( time:number ) {
    
    if ( mixer && clock ) {
      const delta = clock.getDelta();
      mixer.update( delta );
    }
    raycaster.setFromCamera( pointer, camera );
  
    const intersected = raycaster.intersectObjects( scene.children, true );
  
    intersectionWatcher('DIE', intersected);
  
    render();
  
  }
  
  resizeHandler(renderer, camera, render);

  
}

init();