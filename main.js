import * as TR from 'three';
import tileImages from './tileImports.js';

const MAP_SIZE = 16; // Size of the map grid

// Scene and renderer setup
const scene = new TR.Scene();
const renderer = new TR.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Camera setup
const aspectRatio = window.innerWidth / window.innerHeight;
const cameraSize = MAP_SIZE;
const camera = new TR.OrthographicCamera(-cameraSize * aspectRatio, cameraSize * aspectRatio, cameraSize, -cameraSize, 0.1, 1000);
camera.position.set(0, MAP_SIZE * 2, MAP_SIZE * 2);
camera.lookAt(0, 0, 0);

// Handle window resize
window.addEventListener('resize', () => {
  const newAspectRatio = window.innerWidth / window.innerHeight;
  camera.left = -cameraSize * newAspectRatio;
  camera.right = cameraSize * newAspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Array to hold all loaded tile meshes
const tileMeshes = [];

// Function to load all tile textures and dimensions
async function loadAllTiles() {
  const textureLoader = new TR.TextureLoader();

  const promises = Object.keys(tileImages).map((key) => {
    return new Promise((resolve) => {
      textureLoader.load(tileImages[key], (texture) => {
        texture.wrapS = TR.ClampToEdgeWrapping;
        texture.wrapT = TR.ClampToEdgeWrapping;
        texture.magFilter = TR.NearestFilter;
        texture.minFilter = TR.NearestFilter;

        const img = texture.image;
        if (img.width && img.height) {
          resolve({ tileTexture: texture, tileWidth: img.width, tileHeight: img.height });
        } else {
          img.onload = () => {
            resolve({ tileTexture: texture, tileWidth: img.width, tileHeight: img.height });
          };
        }
      });
    });
  });

  return Promise.all(promises);
}

// Function to create tiles in an isometric grid with correct rendering order
function drawTilesOnGrid(tiles) {
  const tileScale = 1 / 64; // Assuming 128 pixels per unit as per Unity

  const tileData = tiles[1]; // Select the first tile (you can randomize this if needed)
  const { tileTexture, tileWidth, tileHeight } = tileData;

  // Create geometry and material for the tiles
  const geometry = new TR.PlaneGeometry(tileWidth * tileScale, tileHeight * tileScale);
  const material = new TR.MeshBasicMaterial({
    map: tileTexture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false, // Prevents depth buffer issues
    depthTest: false,
  });

  // Create a 2D array to hold the tiles
  const tileGrid = [];

  // Populate the tile grid
  for (let row = 0; row < MAP_SIZE; row++) {
    tileGrid[row] = [];
    for (let col = 0; col < MAP_SIZE; col++) {
      const tileMesh = new TR.Mesh(geometry, material.clone());

      // Calculate isometric positions
      const gap = 1;
      const x = (col - row) * (tileWidth * tileScale) * 0.5 * gap;
      const z = (col + row) * (tileHeight * tileScale) * 0.25 * gap;

      tileMesh.position.set(x, 0, z);

      // Rotate the tile to face upward
      tileMesh.rotation.x = -Math.PI / 2;

      tileGrid[row][col] = tileMesh;
    }
  }

  // Render tiles in the correct order
  let renderOrder = 0;
  for (let sum = 0; sum <= (MAP_SIZE - 1) * 2; sum++) {
    for (let row = 0; row < MAP_SIZE; row++) {
      let col = sum - row;
      if (col >= 0 && col < MAP_SIZE) {
        const tileMesh = tileGrid[row][col];
        tileMesh.renderOrder = renderOrder++;
        scene.add(tileMesh);
        tileMeshes.push(tileMesh);
      }
    }
  }
}

// Initialize the scene
async function init() {
  const tiles = await loadAllTiles();
  drawTilesOnGrid(tiles);
}

init();

// Raycasting for interaction
const raycaster = new TR.Raycaster();
const mouse = new TR.Vector2();

function onClick(event) {
  mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(tileMeshes);
  if (intersects.length) {
    const { point } = intersects[0];
    // Convert world coordinates back to grid coordinates
    const tileScale = 1 / 128;
    const tileWidthScaled = tileWidth * tileScale;
    const tileHeightScaled = tileHeight * tileScale;

    const col = Math.round((point.x / (tileWidthScaled * 0.5) + point.z / (tileHeightScaled * 0.25)) / 2);
    const row = Math.round((point.z / (tileHeightScaled * 0.25) - point.x / (tileWidthScaled * 0.5)) / 2);
    console.log('Tile clicked:', { col, row });
  }
}
window.addEventListener('click', onClick);

// Render loop
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
