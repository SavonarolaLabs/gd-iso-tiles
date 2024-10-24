import * as TR from 'three';
import tileImages from './tileImports.js';
import { rocks } from './src/rocks.js';

const MAP_SIZE = 64;
const MAX_SIDE = MAP_SIZE;
const scene = new TR.Scene();
const renderer = new TR.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = TR.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const aspectRatio = window.innerWidth / window.innerHeight;
const cameraSize = MAP_SIZE / 3;
const camera = new TR.OrthographicCamera(-cameraSize * aspectRatio, cameraSize * aspectRatio, cameraSize, -cameraSize, 0.1, 1000);

// Retrieve camera position from localStorage if it exists
let savedCameraPosition = JSON.parse(localStorage.getItem('cameraPosition')) || { deltaX: 0, deltaZ: 0 };
let deltaX = savedCameraPosition.deltaX;
let deltaZ = savedCameraPosition.deltaZ;

camera.position.set(deltaX, MAP_SIZE, deltaZ);
camera.lookAt(deltaX, 0, deltaZ);

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

const basicTilesNames = [
  //'ISO_Tile_Dirt_01_Grass_01_Green',
  'ISO_Tile_Dirt_01',
  'ISO_Tile_Water_Block',
  //'ISO_Tile_Dirt_01_Grass_01',
  'ISO_Tile_Dirt_01_Grass_01',
  'ISO_Tile_LavaCracks_01',
  'ISO_Tile_Snow_02',
  'ISO_Tile_Brick_Stone_01_04',
  'ISO_Tile_Stone_02',
  'ISO_Tile_Dirt_01_GrassPatch_03',
  'ISO_Tile_Sand_02',
];
const specialWaterTilesNames = ['ISO_Tile_Water_Shore_1S_04'];
let basicTiles = [];
let specialWaterTiles = [];

const textureImages = {
  Empire_capital: 'assets/castles/doomed.png',
  Demons_capital: 'assets/castles/empire.png',
  Gnomes_capital: 'assets/castles/mountains.png',
  Undead_capital: 'assets/castles/undead.png',
};

const treeImages = {
  doomed_tree: 'assets/foliage/doomed_tree.png',
  empire_tree: 'assets/foliage/empire_tree.png',
  mountains_tree: 'assets/foliage/mountains_tree.png',
  undead_tree: 'assets/foliage/undead_tree.png',
};

async function loadTexturesFromList(imageList) {
  const textureLoader = new TR.TextureLoader();
  const promises = Object.keys(imageList).map((key) => {
    return new Promise((resolve) => {
      textureLoader.load(
        imageList[key],
        (texture) => {
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
        },
        undefined,
        (err) => {
          console.error(err);
        }
      );
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

async function drawRocks() {
  const tileScale = 0.07 * 0.6;
  let img = {};
  rocks.forEach((rock) => {
    const a = rock.split('/');
    const name = a[a.length - 1];
    img[name.split('.')[0]] = rock;
  });
  const textures = await loadTexturesFromList(img);
  const meshPositions = [
    { texture: textures[5], position: [MAP_SIZE * 0.2 + 1.1, 0.0, MAP_SIZE / 2 - 0.4] },
    { texture: textures[5], position: [MAP_SIZE * 0.2, 0.0, MAP_SIZE / 2 - 1.4] },
  ];

  meshPositions.forEach(({ texture, position }) => {
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
    const scale = 0.25;
    mesh.scale.set(scale, scale, scale);
    mesh.renderOrder = MAP_SIZE * MAP_SIZE + 100;
    scene.add(mesh);
  });
}

async function drawFoliage() {
  const textures = await loadTexturesFromList(treeImages);
  const tileScale = 0.05;
  const meshPositions = [
    { texture: textures[1], position: [MAP_SIZE * 0.2, 0, MAP_SIZE * 0.45 + 0.7] },
    { texture: textures[0], position: [MAP_SIZE * 0.2, 0, MAP_SIZE * 0.8] },
    {
      texture: textures[2],
      position: [MAP_SIZE / 3, 0, MAP_SIZE / 2],
    },
    {
      texture: textures[3],
      position: [-MAP_SIZE * 0.3, 0, MAP_SIZE * 0.5],
    },
  ];

  meshPositions.forEach(({ texture, position }) => {
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
    const scale = 0.25;
    mesh.scale.set(scale, scale, scale);
    mesh.renderOrder = MAP_SIZE * MAP_SIZE + 10;
    scene.add(mesh);
  });
}

async function drawBuilding() {
  const textures = await loadTexturesFromList(textureImages);
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

  // Save camera position to localStorage
  localStorage.setItem('cameraPosition', JSON.stringify({ deltaX, deltaZ }));
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
  const grassPatchMaterial = createMaterial(basicTiles[7].tileTexture);
  const woodMaterial = createMaterial(basicTiles[8].tileTexture);
  const hellMaterial = createMaterial(basicTiles[5].tileTexture);
  const undeadMaterial = createMaterial(basicTiles[6].tileTexture);
  const gnomesMaterial = createMaterial(basicTiles[4].tileTexture);
  const lavaCrackMaterial = createMaterial(basicTiles[3].tileTexture);
  const neutralMaterial = createMaterial(basicTiles[0].tileTexture);
  const waterMaterial = createMaterial(basicTiles[1].tileTexture);

  const tileGrid = [];
  for (let row = 0; row < MAP_SIZE; row++) {
    tileGrid[row] = [];
    for (let col = 0; col < MAP_SIZE; col++) {
      let material;
      if (col < MAP_SIZE / 2 && row < MAP_SIZE / 2) {
        material = Math.random() > 0.2 ? imperialMaterial : grassPatchMaterial;
      } else if (col >= MAP_SIZE / 2 && row < MAP_SIZE / 2) {
        material = gnomesMaterial;
      } else if (col < MAP_SIZE / 2 && row >= MAP_SIZE / 2) {
        material = undeadMaterial;
      } else {
        material = Math.random() > 0.5 ? hellMaterial : lavaCrackMaterial;
      }

      const neutralZoneStart = (2 * MAP_SIZE) / 6;
      const neutralZoneEnd = (4 * MAP_SIZE) / 6;
      if (col >= neutralZoneStart && col < neutralZoneEnd && row >= neutralZoneStart && row < neutralZoneEnd) {
        material = woodMaterial;
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
        tileMesh.name = `${sum}-${row}`;
        scene.add(tileMesh);
        tileMeshes.push(tileMesh);
      }
    }
  }
}

// mouse drag
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

renderer.domElement.addEventListener('contextmenu', (event) => {
  event.preventDefault(); // This prevents the context menu from opening
});

renderer.domElement.addEventListener('mousedown', (event) => {
  if (event.button === 0) {
    const mouse = new TR.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new TR.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      console.log(intersects.length, clickedObject);

      // Perform right-click action (e.g., open menu, select, etc.)
    }
  }

  if (event.button === 2) {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
  }
});

renderer.domElement.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y,
    };

    const moveSpeed = 0.1;
    deltaX -= deltaMove.x * moveSpeed;
    deltaZ -= deltaMove.y * moveSpeed;

    deltaX = Math.max(Math.min(deltaX, MAX_SIDE), -MAX_SIDE);
    deltaZ = Math.max(Math.min(deltaZ, MAX_SIDE), -MAX_SIDE);

    camera.position.set(deltaX, MAP_SIZE, deltaZ);
    camera.lookAt(deltaX, 0, deltaZ);

    previousMousePosition = { x: event.clientX, y: event.clientY };

    // Save camera position to localStorage
    localStorage.setItem('cameraPosition', JSON.stringify({ deltaX, deltaZ }));
  }
});

renderer.domElement.addEventListener('mouseup', () => {
  isDragging = false;
});

renderer.domElement.addEventListener('mouseleave', () => {
  isDragging = false;
});

async function init() {
  await loadAllTiles();
  drawTilesOnGrid();
  await drawBuilding();
  await drawFoliage();
  await drawRocks();
}

init();

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
