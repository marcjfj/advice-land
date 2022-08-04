import type { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const loadModel = (loader:GLTFLoader, url:string): Promise<GLTF> => {
  return new Promise((resolve, reject) => {
    loader.load(
      url,

      (gltf:GLTF) => {
        resolve(gltf);
      },

      undefined,

      (error:ErrorEvent) => {
        console.error('An error happened.', error);
        reject(error);
      }
    );
  });
}

export const isChildOf = ( name : string, object : THREE.Object3D ) : boolean => {
  if (object.name === name) {
    return true;
  }
  if (object.parent) {
    return isChildOf(name, object.parent);
  }
  return false;
}

