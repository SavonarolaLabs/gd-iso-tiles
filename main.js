import * as TR from 'three';
import tileImages from './tileImports.js';

const MAP_SIZE = 16; // Size of the map grid

// Scene and renderer setup
const scene = new TR.Scene();

const renderer = new TR.WebGLRenderer({ antialias: true, alpha: false });
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

// Array to hold all loaded tile meshes and the tiles data
let tileMeshes = [];
let tiles = [];
let overlayTiles = [];
let currentTileIndex = 0; // Start with the first tile in the list
let currentOverlayIndex = 0; // Start with the first overlay in the list

let basicTilesNames = ['ISO_Tile_Dirt_01', 'ISO_Tile_Water_Block', 'ISO_Tile_Brick_Stone_01_04', 'ISO_Tile_Sand_03', 'ISO_Tile_Snow_02', 'ISO_Tile_Lava_02'];
let basicTiles = [];
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
          resolve({
            name: key,
            tileTexture: texture,
            tileWidth: img.width,
            tileHeight: img.height,
          });
        } else {
          img.onload = () => {
            resolve({
              name: key,
              tileTexture: texture,
              tileWidth: img.width,
              tileHeight: img.height,
            });
          };
        }
      });
    });
  });

  const allTiles = await Promise.all(promises); // Set the global tiles variable

  // Separate base tiles and overlay tiles
  tiles = allTiles.filter((tile) => !tile.name.startsWith('ISO_Overlay'));
  basicTiles = allTiles.filter((tile) => basicTilesNames.includes(tile.name));
  overlayTiles = allTiles.filter((tile) => tile.name.startsWith('ISO_Overlay') && !tile.name.includes('Roof'));

  return tiles;
}

// Event listener for switching tiles
window.addEventListener('keydown', (event) => {
  if (event.key === '1') {
    currentTileIndex = (currentTileIndex - 1 + tiles.length) % tiles.length;
    console.log('Switched to previous base tile:', currentTileIndex);
    updateTileTextures(currentTileIndex, currentOverlayIndex);
  } else if (event.key === '2') {
    currentTileIndex = (currentTileIndex + 1) % tiles.length;
    console.log('Switched to next base tile:', currentTileIndex);
    updateTileTextures(currentTileIndex, currentOverlayIndex);
  } else if (event.key === '3') {
    currentOverlayIndex = (currentOverlayIndex - 1 + overlayTiles.length) % overlayTiles.length;
    console.log('Switched to previous overlay tile:', currentOverlayIndex);
    updateTileTextures(currentTileIndex, currentOverlayIndex);
  } else if (event.key === '4') {
    currentOverlayIndex = (currentOverlayIndex + 1) % overlayTiles.length;
    console.log('Switched to next overlay tile:', currentOverlayIndex);
    updateTileTextures(currentTileIndex, currentOverlayIndex);
  }
});

// Function to create tiles in an isometric grid with correct rendering order
async function drawTilesOnGrid() {
  const tileScale = 1 / 64; // Assuming 128 pixels per unit

  // Use the current tile index to get the first tile's dimensions
  const { tileTexture, tileWidth, tileHeight } = tiles[currentTileIndex];
  const { tileTexture: overlayTexture } = overlayTiles[currentOverlayIndex];

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

  const overlayMaterial = new TR.MeshBasicMaterial({
    map: overlayTexture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false, // Prevents depth buffer issues
    depthTest: false,
  });

  // Create a 2D array to hold the tiles
  const tileGrid = [];
  const { tileTexture: imperialTexture } = basicTiles[1];

  const imperialMaterial = new TR.MeshBasicMaterial({
    map: imperialTexture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false, // Prevents depth buffer issues
    depthTest: false,
  });

  const imperialTileMesh = new TR.Mesh(geometry, imperialMaterial.clone());

  // Populate the tile grid
  for (let row = 0; row < MAP_SIZE; row++) {
    tileGrid[row] = [];
    for (let col = 0; col < MAP_SIZE; col++) {
      const tileMesh = new TR.Mesh(geometry, imperialMaterial.clone());
      const overlayMesh = new TR.Mesh(geometry, overlayMaterial.clone());

      // Calculate isometric positions
      const gap = 1;
      const x = (col - row) * (tileWidth * tileScale) * 0.5 * gap;
      const z = (col + row) * (tileHeight * tileScale) * 0.25 * gap;

      tileMesh.position.set(x, 0, z);
      overlayMesh.position.set(x, 0, z);

      // Rotate the tile to face upward
      tileMesh.rotation.x = -Math.PI / 2;
      overlayMesh.rotation.x = -Math.PI / 2;

      // Each tile position holds an array of tile meshes (base + overlay)
      tileGrid[row][col] = [tileMesh, overlayMesh];
    }
  }

  // Render tiles in the correct order
  let renderOrder = 0;
  for (let sum = 0; sum <= (MAP_SIZE - 1) * 2; sum++) {
    for (let row = 0; row < MAP_SIZE; row++) {
      let col = sum - row;
      if (col >= 0 && col < MAP_SIZE) {
        const tileMeshesArray = tileGrid[row][col];
        scene.add(tileMeshesArray[0]);
        tileMeshes.push(tileMeshesArray[0]);

        // for (const tileMesh of tileMeshesArray) {
        //   tileMesh.renderOrder = renderOrder++;
        //   scene.add(tileMesh);
        //   tileMeshes.push(tileMesh);
        // }
      }
    }
  }
}

// Function to update the textures of all tiles on the grid
function updateTileTextures(tileIndex, overlayIndex) {
  tileMeshes.forEach((tileMesh, i) => {
    const rowTileIndex = (tileIndex + Math.floor(i / MAP_SIZE)) % tiles.length;
    const rowOverlayIndex = (overlayIndex + Math.floor(i / MAP_SIZE)) % overlayTiles.length;

    if (i % 2 === 0) {
      // Base tile
      tileMesh.material.map = tiles[rowTileIndex].tileTexture;
    } else {
      // Overlay tile
      //tileMesh.material.map = overlayTiles[rowOverlayIndex].tileTexture;
    }
    tileMesh.material.map.needsUpdate = true;
  });
}

// Initialize the scene
async function init() {
  await loadAllTiles();
  drawTilesOnGrid(); // Use loaded tiles
}

init();

// Render loop
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
