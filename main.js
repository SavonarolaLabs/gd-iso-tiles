import * as TR from 'three';
import tileImages from './tileImports.js';

const MAP_SIZE = 16; // Size of the map grid

// Scene and renderer setup
const scene = new TR.Scene();

const renderer = new TR.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = TR.SRGBColorSpace;
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

let basicTilesNames = ['ISO_Tile_Dirt_02', 'ISO_Tile_Water_Block', 'ISO_Tile_Brick_Stone_01_02', 'ISO_Tile_Brick_Stone_01_04', 'ISO_Tile_Snow_02', 'ISO_Tile_Lava_02'];
let specialWaterTilesNames = ['ISO_Tile_Water_Shore_1S_04'];
let basicTiles = [];
let specialWaterTiles = [];
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
  basicTiles = basicTilesNames.map((t) => allTiles.find((tt) => tt.name == t));
  overlayTiles = allTiles.filter((tile) => tile.name.startsWith('ISO_Overlay') && !tile.name.includes('Roof'));
  specialWaterTiles = specialWaterTilesNames.map((t) => allTiles.find((tt) => tt.name == t));
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

  const imperialTexture = basicTiles[2].tileTexture;
  const hellTexture = basicTiles[5].tileTexture;
  const gnomesTexture = basicTiles[4].tileTexture;
  const necroTexture = basicTiles[3].tileTexture;
  const neutralTexture = basicTiles[0].tileTexture;
  const waterTexture = basicTiles[1].tileTexture;
  const waterShoreTexture = specialWaterTiles[0].tileTexture;

  const waterShoreMaterial = new TR.MeshBasicMaterial({
    map: waterShoreTexture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false, // Prevents depth buffer issues
    depthTest: false,
  });
  const waterMaterial = new TR.MeshBasicMaterial({
    map: waterTexture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false, // Prevents depth buffer issues
    depthTest: false,
  });
  const neutralMaterial = new TR.MeshBasicMaterial({
    map: neutralTexture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false, // Prevents depth buffer issues
    depthTest: false,
  });
  const necroMaterial = new TR.MeshBasicMaterial({
    map: necroTexture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false, // Prevents depth buffer issues
    depthTest: false,
  });
  const gnomesMaterial = new TR.MeshBasicMaterial({
    map: gnomesTexture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false, // Prevents depth buffer issues
    depthTest: false,
  });
  const hellMaterial = new TR.MeshBasicMaterial({
    map: hellTexture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false, // Prevents depth buffer issues
    depthTest: false,
  });
  const imperialMaterial = new TR.MeshBasicMaterial({
    map: imperialTexture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false, // Prevents depth buffer issues
    depthTest: false,
  });

  // Populate the tile grid
  for (let row = 0; row < MAP_SIZE; row++) {
    tileGrid[row] = [];
    for (let col = 0; col < MAP_SIZE; col++) {
      let tileMesh = new TR.Mesh(geometry, material);
      let overlayMesh = new TR.Mesh(geometry, overlayMaterial);

      if (col < (3 * MAP_SIZE) / 4 || col >= MAP_SIZE / 4) {
        if (row < MAP_SIZE / 4) {
          tileMesh = new TR.Mesh(geometry, imperialMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        } else {
          if (row < MAP_SIZE / 2) {
            tileMesh = new TR.Mesh(geometry, gnomesMaterial);
            overlayMesh = new TR.Mesh(geometry, overlayMaterial);
          } else {
            tileMesh = new TR.Mesh(geometry, necroMaterial);
            overlayMesh = new TR.Mesh(geometry, overlayMaterial);
          }
          if (row > MAP_SIZE / 1.4) {
            tileMesh = new TR.Mesh(geometry, hellMaterial);
            overlayMesh = new TR.Mesh(geometry, overlayMaterial);
          }
        }
      }

      if (col < MAP_SIZE / 4) {
        tileMesh = new TR.Mesh(geometry, waterMaterial);
        overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        if (col == 3) {
          tileMesh = new TR.Mesh(geometry, waterShoreMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        }
      } else {
        if (col >= (3 * MAP_SIZE) / 4) {
          tileMesh = new TR.Mesh(geometry, neutralMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        } else {
        }
      }

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
