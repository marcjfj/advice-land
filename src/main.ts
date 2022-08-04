import './style.css';
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
  document.body.appendChild(renderer.domElement);

  const render = () => {
    renderer.render(scene, camera);
  };
  // load initial scene
  setupOrbitControls(camera, renderer);
  setupLights(scene);
  setupFloorAndWalls(scene);
  setupChalkboard(scene);
  setupChalkboard(scene);
  setupTable(scene);
  const [dice, text] = await Promise.all([setupDice(scene), setupText(scene)]);
  // dice roll animation
  const { mixer, clock, playDiceRoll } = diceAnimation(dice);
  // main animation loop
  renderer.setAnimationLoop(animationLoop);

  const pointer = setupPointer();
  const raycaster = new THREE.Raycaster();

  // Update chalkboard text with response data
  setupClickHandler(scene, pointer, camera, raycaster, async () => {
    playDiceRoll();
    text.text = await fetchAdvice();
  });

  function animationLoop(_time: number) {
    // Update animation mixer for dice roll
    if (mixer && clock) {
      const delta = clock.getDelta();
      mixer.update(delta);
    }
    // watch for intersection with dice
    raycaster.setFromCamera(pointer, camera);
    const intersected = raycaster.intersectObjects(scene.children, true);
    intersectionWatcher('DIE', intersected);

    render();
  }
  // Handler window resize events
  resizeHandler(renderer, camera, render);
};

init();
