import * as TR from 'three';
import tileImages from './tileImports.js';

const MAP_SIZE = 64;
const MAX_SIDE = MAP_SIZE;
const scene = new TR.Scene();
const renderer = new TR.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = TR.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const aspectRatio = window.innerWidth / window.innerHeight;
const cameraSize = MAP_SIZE / 2;
const camera = new TR.OrthographicCamera(-cameraSize * aspectRatio, cameraSize * aspectRatio, cameraSize, -cameraSize, 0.1, 1000);

let deltaX = 0;
let deltaZ = 0;
camera.position.set(deltaX, MAP_SIZE, MAP_SIZE / 2 + deltaZ - 20);
camera.lookAt(deltaX, 0, MAP_SIZE / 2 + deltaZ - 20);

window.addEventListener('resize', () => {
  const newAspectRatio = window.innerWidth / window.innerHeight;
  camera.left = -cameraSize * newAspectRatio;
  camera.right = cameraSize * newAspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let tileMeshes = [];
let tiles = [];
let overlayTiles = [];
let currentTileIndex = 0;
let currentOverlayIndex = 46;

const basicTilesNames = ['ISO_Tile_Dirt_02', 'ISO_Tile_Water_Block', 'ISO_Tile_Brick_Stone_01_02', 'ISO_Tile_Brick_Stone_01_04', 'ISO_Tile_Snow_02', 'ISO_Tile_Lava_02'];
const specialWaterTilesNames = ['ISO_Tile_Water_Shore_1S_04'];
let basicTiles = [];
let specialWaterTiles = [];

const textureImages = {
  Empire_capital: 'assets/castles/doomed.png',
  Demons_capital: 'assets/castles/empire.png',
  Gnomes_capital: 'assets/castles/mountains.png',
  Undead_capital: 'assets/castles/undead.png',
};

async function loadTexturesFromList(imageList) {
  const textureLoader = new TR.TextureLoader();
  const promises = Object.keys(imageList).map((key) => {
    return new Promise((resolve) => {
      textureLoader.load(imageList[key], (texture) => {
        texture.wrapS = TR.ClampToEdgeWrapping;
        texture.wrapT = TR.ClampToEdgeWrapping;
        texture.magFilter = TR.NearestFilter;
        texture.minFilter = TR.NearestFilter;
        texture.colorSpace = TR.SRGBColorSpace;

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
  return await Promise.all(promises);
}

async function loadAllTiles() {
  const allTiles = await loadTexturesFromList(tileImages);
  tiles = allTiles.filter((tile) => !tile.name.startsWith('ISO_Overlay'));
  overlayTiles = allTiles.filter((tile) => tile.name.startsWith('ISO_Overlay') && !tile.name.includes('Roof'));
  basicTiles = basicTilesNames.map((name) => allTiles.find((tile) => tile.name === name));
  specialWaterTiles = specialWaterTilesNames.map((name) => allTiles.find((tile) => tile.name === name));
}

async function loadBuildingTextures() {
  return await loadTexturesFromList(textureImages);
}

async function drawBuilding() {
  const textures = await loadBuildingTextures();
  const tileScale = (1 / 64 / 2 / 5) * 8;
  const stepFromEdge = 8;
  const capitalSize = 8;
  const buildingPositions = [
    { texture: textures[1], position: [0, 0, stepFromEdge] },
    { texture: textures[0], position: [0, 0, MAP_SIZE - stepFromEdge + capitalSize] },
    {
      texture: textures[2],
      position: [MAP_SIZE - stepFromEdge - capitalSize, 0, MAP_SIZE / 2 + capitalSize / 2],
    },
    {
      texture: textures[3],
      position: [-MAP_SIZE + stepFromEdge + capitalSize, 0, MAP_SIZE / 2 + capitalSize / 2],
    },
  ];
  buildingPositions.forEach(({ texture, position }) => {
    const { tileTexture, tileWidth, tileHeight } = texture;
    const geometry = new TR.PlaneGeometry(tileWidth * tileScale, tileHeight * tileScale);
    const material = new TR.MeshBasicMaterial({
      map: tileTexture,
      transparent: true,
      side: TR.DoubleSide,
      alphaTest: 0.5,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new TR.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(...position);
    mesh.renderOrder = MAP_SIZE * MAP_SIZE;
    scene.add(mesh);
  });
}

window.addEventListener('keydown', (event) => {
  const mapStep = 3;
  switch (event.key) {
    case 'w':
      deltaZ = Math.max(deltaZ - mapStep, -MAX_SIDE);
      break;
    case 's':
      deltaZ = Math.min(deltaZ + mapStep, MAX_SIDE);
      break;
    case 'd':
      deltaX = Math.min(deltaX + mapStep, MAX_SIDE);
      break;
    case 'a':
      deltaX = Math.max(deltaX - mapStep, -MAX_SIDE);
      break;
  }
  camera.position.set(deltaX, MAP_SIZE, deltaZ);
  camera.lookAt(deltaX, 0, deltaZ);
});

function createMaterial(texture) {
  return new TR.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: TR.DoubleSide,
    alphaTest: 0.5,
    depthWrite: false,
    depthTest: false,
  });
}

function drawTilesOnGrid() {
  const tileScale = 1 / 64;
  const { tileWidth, tileHeight } = tiles[currentTileIndex];
  const geometry = new TR.PlaneGeometry(tileWidth * tileScale, tileHeight * tileScale);
  const overlayMaterial = createMaterial(overlayTiles[currentOverlayIndex].tileTexture);
  const imperialMaterial = createMaterial(basicTiles[2].tileTexture);
  const hellMaterial = createMaterial(basicTiles[5].tileTexture);
  const gnomesMaterial = createMaterial(basicTiles[4].tileTexture);
  const necroMaterial = createMaterial(basicTiles[3].tileTexture);
  const neutralMaterial = createMaterial(basicTiles[0].tileTexture);
  const waterMaterial = createMaterial(basicTiles[1].tileTexture);

  const tileGrid = [];
  for (let row = 0; row < MAP_SIZE; row++) {
    tileGrid[row] = [];
    for (let col = 0; col < MAP_SIZE; col++) {
      let material;
      if (col < MAP_SIZE / 2 && row < MAP_SIZE / 2) {
        material = imperialMaterial;
      } else if (col >= MAP_SIZE / 2 && row < MAP_SIZE / 2) {
        material = gnomesMaterial;
      } else if (col < MAP_SIZE / 2 && row >= MAP_SIZE / 2) {
        material = necroMaterial;
      } else {
        material = hellMaterial;
      }

      const neutralZoneStart = (2 * MAP_SIZE) / 6;
      const neutralZoneEnd = (4 * MAP_SIZE) / 6;
      if (col >= neutralZoneStart && col < neutralZoneEnd && row >= neutralZoneStart && row < neutralZoneEnd) {
        material = neutralMaterial;
      }

      const waterSize = 3;
      const waterZones = [
        { x: neutralZoneStart - waterSize, y: neutralZoneStart - waterSize },
        { x: neutralZoneEnd - waterSize, y: neutralZoneEnd - waterSize },
        { x: neutralZoneStart - waterSize, y: neutralZoneEnd - waterSize },
        { x: neutralZoneEnd - waterSize, y: neutralZoneStart - waterSize },
      ];
      for (const zone of waterZones) {
        if (col >= zone.x && col < zone.x + 2 * waterSize && row >= zone.y && row < zone.y + 2 * waterSize) {
          material = waterMaterial;
        }
      }

      const tileMesh = new TR.Mesh(geometry, material);
      const x = (col - row) * (tileWidth * tileScale) * 0.5;
      const z = (col + row) * (tileHeight * tileScale) * 0.25;
      tileMesh.position.set(x, 0, z);
      tileMesh.rotation.x = -Math.PI / 2;
      tileGrid[row][col] = tileMesh;
    }
  }

  let renderOrder = 0;
  for (let sum = 0; sum <= (MAP_SIZE - 1) * 2; sum++) {
    for (let row = 0; row < MAP_SIZE; row++) {
      const col = sum - row;
      if (col >= 0 && col < MAP_SIZE) {
        const tileMesh = tileGrid[row][col];
        tileMesh.renderOrder = renderOrder++;
        scene.add(tileMesh);
        tileMeshes.push(tileMesh);
      }
    }
  }
}

async function init() {
  await loadAllTiles();
  await drawBuilding();
  drawTilesOnGrid();
}

init();

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
