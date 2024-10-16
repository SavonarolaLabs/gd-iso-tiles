import * as TR from 'three';
import tileImages from './tileImports.js';

const MAP_SIZE = 64; // Size of the map grid

// Scene and renderer setup
const scene = new TR.Scene();

const renderer = new TR.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = TR.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Camera setup
const aspectRatio = window.innerWidth / window.innerHeight;

const cameraSize = MAP_SIZE / 2;
const camera = new TR.OrthographicCamera(-cameraSize * aspectRatio, cameraSize * aspectRatio, cameraSize, -cameraSize, 0.1, 1000);

let deltaX = 0;
let deltaZ = 0;
camera.position.set(0 + deltaX, MAP_SIZE, MAP_SIZE / 2 + deltaZ - 20);
camera.lookAt(0 + deltaX, 0, MAP_SIZE / 2 + deltaZ - 20);

const MAX_SIDE = MAP_SIZE;

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
let currentOverlayIndex = 46; // Start with the first overlay in the list
// 53 - potential Road Overlay

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

const textureImages = {
  Empire_capital: 'assets/castles/doomed.png',
  Demons_capital: 'assets/castles/empire.png',
  Gnomes_capital: 'assets/castles/mountains.png',
  Undead_capital: 'assets/castles/undead.png',
};

// Textures -> Material + Geometry -> Mesh
async function loadTextures() {
  const textureLoader = new TR.TextureLoader();

  const promises = Object.keys(textureImages).map((key) => {
    return new Promise((resolve) => {
      textureLoader.load(textureImages[key], (texture) => {
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
  const allTextures = await Promise.all(promises); // Set the global tiles variable
  return allTextures;
}

const textures = await loadTextures();

async function drawBuilding() {
  const tileScale = (1 / 64 / 2 / 5) * 8; // Assuming 128 pixels per unit
  const stepFromEdge = 8;
  const capitalSize = 8;

  {
    const { tileTexture: EmpireCapitalTexture, tileWidth: EmpireCapitalWidth, tileHeight: EmpireCapitalHeight } = textures[1];
    const EmpireCapitalGeometry = new TR.PlaneGeometry(EmpireCapitalWidth * tileScale, EmpireCapitalHeight * tileScale);
    const EmpireCapitalMaterial = new TR.MeshBasicMaterial({
      map: EmpireCapitalTexture,
      transparent: true,
      side: TR.DoubleSide,
      alphaTest: 0.5,
      depthWrite: false, // Prevents depth buffer issues
      depthTest: false,
    });
    let EmpireCapitalMesh = new TR.Mesh(EmpireCapitalGeometry, EmpireCapitalMaterial);
    EmpireCapitalMesh.rotation.x = -Math.PI / 2;
    EmpireCapitalMesh.position.set(0, 0, stepFromEdge);
    EmpireCapitalMesh.renderOrder = MAP_SIZE * MAP_SIZE;
    scene.add(EmpireCapitalMesh);
  }

  {
    const { tileTexture: DemonsCapitalTexture, tileWidth: DemonsCapitalWidth, tileHeight: DemonsCapitalHeight } = textures[0];
    const DemonsCapitalGeometry = new TR.PlaneGeometry(DemonsCapitalWidth * tileScale, DemonsCapitalHeight * tileScale);
    const DemonsCapitalMaterial = new TR.MeshBasicMaterial({
      map: DemonsCapitalTexture,
      transparent: true,
      side: TR.DoubleSide,
      alphaTest: 0.5,
      depthWrite: false, // Prevents depth buffer issues
      depthTest: false,
    });
    let DemonsCapitalMesh = new TR.Mesh(DemonsCapitalGeometry, DemonsCapitalMaterial);
    DemonsCapitalMesh.rotation.x = -Math.PI / 2;
    DemonsCapitalMesh.position.set(0, 0, MAP_SIZE - stepFromEdge + capitalSize);
    DemonsCapitalMesh.renderOrder = MAP_SIZE * MAP_SIZE;
    scene.add(DemonsCapitalMesh);
  }

  {
    const { tileTexture: GnomesCapitalTexture, tileWidth: GnomesCapitalWidth, tileHeight: GnomesCapitalHeight } = textures[2];
    const GnomesCapitalGeometry = new TR.PlaneGeometry(GnomesCapitalWidth * tileScale, GnomesCapitalHeight * tileScale);
    const GnomesCapitalMaterial = new TR.MeshBasicMaterial({
      map: GnomesCapitalTexture,
      transparent: true,
      side: TR.DoubleSide,
      alphaTest: 0.5,
      depthWrite: false, // Prevents depth buffer issues
      depthTest: false,
    });

    let GnomesCapitalMesh = new TR.Mesh(GnomesCapitalGeometry, GnomesCapitalMaterial);
    GnomesCapitalMesh.rotation.x = -Math.PI / 2;
    GnomesCapitalMesh.position.set(MAP_SIZE - stepFromEdge - capitalSize, 0, MAP_SIZE / 2 + capitalSize / 2);
    GnomesCapitalMesh.renderOrder = MAP_SIZE * MAP_SIZE;
    scene.add(GnomesCapitalMesh);
  }
  {
    const { tileTexture: UndeadCapitalTexture, tileWidth: UndeadCapitalWidth, tileHeight: UndeadCapitalHeight } = textures[3];
    const UndeadCapitalGeometry = new TR.PlaneGeometry(UndeadCapitalWidth * tileScale, UndeadCapitalHeight * tileScale);
    const UndeadCapitalMaterial = new TR.MeshBasicMaterial({
      map: UndeadCapitalTexture,
      transparent: true,
      side: TR.DoubleSide,
      alphaTest: 0.5,
      depthWrite: false, // Prevents depth buffer issues
      depthTest: false,
    });
    let UndeadCapitalMesh = new TR.Mesh(UndeadCapitalGeometry, UndeadCapitalMaterial);
    UndeadCapitalMesh.rotation.x = -Math.PI / 2;
    UndeadCapitalMesh.position.set(-MAP_SIZE + stepFromEdge + capitalSize, 0, MAP_SIZE / 2 + capitalSize / 2);
    UndeadCapitalMesh.renderOrder = MAP_SIZE * MAP_SIZE;
    scene.add(UndeadCapitalMesh);
  }
}

// Event listener for switching tiles
window.addEventListener('keydown', (event) => {
  const mapStep = 3;
  if (event.key === 'w') {
    deltaZ = Math.max(deltaZ - mapStep, -MAX_SIDE);
  } else if (event.key === 's') {
    deltaZ = Math.min(deltaZ + mapStep, MAX_SIDE);
  } else if (event.key === 'd') {
    deltaX = Math.min(deltaX + mapStep, MAX_SIDE);
  } else if (event.key === 'a') {
    deltaX = Math.max(deltaX - mapStep, -MAX_SIDE);
  }
  camera.position.set(deltaX, MAP_SIZE, deltaZ);
  camera.lookAt(deltaX, 0, deltaZ);
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

      if (col < MAP_SIZE / 2) {
        if (row < MAP_SIZE / 2) {
          tileMesh = new TR.Mesh(geometry, imperialMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        }
      }

      if (col >= MAP_SIZE / 2) {
        if (row < MAP_SIZE / 2) {
          tileMesh = new TR.Mesh(geometry, gnomesMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        }
      }

      if (col < MAP_SIZE / 2) {
        if (row >= MAP_SIZE / 2) {
          tileMesh = new TR.Mesh(geometry, necroMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        }
      }

      if (col >= MAP_SIZE / 2) {
        if (row >= MAP_SIZE / 2) {
          tileMesh = new TR.Mesh(geometry, hellMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        }
      }

      if (col >= (2 * MAP_SIZE) / 6 && col < (4 * MAP_SIZE) / 6) {
        if (row >= (2 * MAP_SIZE) / 6 && row < (4 * MAP_SIZE) / 6) {
          tileMesh = new TR.Mesh(geometry, neutralMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        }
      }

      const waterSize = 3;
      if (col >= (2 * MAP_SIZE) / 6 - waterSize && col < (2 * MAP_SIZE) / 6 + waterSize) {
        if (row >= (2 * MAP_SIZE) / 6 - waterSize && row < (2 * MAP_SIZE) / 6 + waterSize) {
          tileMesh = new TR.Mesh(geometry, waterMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        }
      }

      if (col >= (4 * MAP_SIZE) / 6 - waterSize && col < (4 * MAP_SIZE) / 6 + waterSize) {
        if (row >= (4 * MAP_SIZE) / 6 - waterSize && row < (4 * MAP_SIZE) / 6 + waterSize) {
          tileMesh = new TR.Mesh(geometry, waterMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        }
      }

      if (col >= (2 * MAP_SIZE) / 6 - waterSize && col < (2 * MAP_SIZE) / 6 + waterSize) {
        if (row >= (4 * MAP_SIZE) / 6 - waterSize && row < (4 * MAP_SIZE) / 6 + waterSize) {
          tileMesh = new TR.Mesh(geometry, waterMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
        }
      }

      if (col >= (4 * MAP_SIZE) / 6 - waterSize && col < (4 * MAP_SIZE) / 6 + waterSize) {
        if (row >= (2 * MAP_SIZE) / 6 - waterSize && row < (2 * MAP_SIZE) / 6 + waterSize) {
          tileMesh = new TR.Mesh(geometry, waterMaterial);
          overlayMesh = new TR.Mesh(geometry, overlayMaterial);
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
      tileGrid[row][col] = [tileMesh];
    }
  }

  // Render tiles in the correct order
  let renderOrder = 0;
  for (let sum = 0; sum <= (MAP_SIZE - 1) * 2; sum++) {
    for (let row = 0; row < MAP_SIZE; row++) {
      let col = sum - row;
      if (col >= 0 && col < MAP_SIZE) {
        const tileMeshesArray = tileGrid[row][col];

        //scene.add(tileMeshesArray[0]);
        //tileMeshes.push(tileMeshesArray[0]);

        for (const tileMesh of tileMeshesArray) {
          tileMesh.renderOrder = renderOrder++;
          scene.add(tileMesh);
          tileMeshes.push(tileMesh);
        }
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
  await drawBuilding();
  await loadAllTiles();
  drawTilesOnGrid(); // Use loaded tiles
}

init();

// Render loop
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
