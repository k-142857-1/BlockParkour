import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

// ===== DOM 与菜单设置 =====
const canvas = document.querySelector("#game-canvas");
const startScreen = document.querySelector("#start-screen");
const startButton = document.querySelector("#start-button");
const settingsButton = document.querySelector("#settings-button");
const gameSettingsButton = document.querySelector("#game-settings-button");
const gamePauseButton = document.querySelector("#game-pause-button");
const pauseModal = document.querySelector("#pause-modal");
const resumeButton = document.querySelector("#resume-button");
const quitButton = document.querySelector("#quit-button");
const settingsModal = document.querySelector("#settings-modal");
const closeSettingsButton = document.querySelector("#close-settings-button");
const languageSelect = document.querySelector("#language-select");
const keybindHint = document.querySelector("#keybind-hint");
const keybindButtons = document.querySelectorAll(".keybind-button");
const settingsStorageKey = "3d-block-settings";

// 界面文案集中放在这里，后面继续加语言时比较好维护。
const translations = {
  zh: {
    subtitle: "一个 3D 方块游戏。",
    startGame: "开始游戏",
    settings: "设置",
    settingsTitle: "设置",
    language: "语言",
    keybinds: "键位",
    moveForward: "前进",
    moveBackward: "后退",
    moveLeft: "左移",
    moveRight: "右移",
    jump: "跳跃",
    switchTopView: "切到俯视",
    switchSideView: "切到侧视",
    pauseTitle: "暂停",
    resumeGame: "继续",
    quitToMenu: "退出到主界面",
    keybindHint: "点击一个键位按钮，然后按下新的按键。",
    waitingForKey: "请按下新的按键...",
  },
  en: {
    subtitle: "A 3D block game.",
    startGame: "Start Game",
    settings: "Settings",
    settingsTitle: "Settings",
    language: "Language",
    keybinds: "Key Bindings",
    moveForward: "Move Forward",
    moveBackward: "Move Backward",
    moveLeft: "Move Left",
    moveRight: "Move Right",
    jump: "Jump",
    switchTopView: "Switch to Top",
    switchSideView: "Switch to Side",
    pauseTitle: "Paused",
    resumeGame: "Resume",
    quitToMenu: "Quit to Menu",
    keybindHint: "Click a key button, then press a new key.",
    waitingForKey: "Press a new key...",
  },
};

// 当前设置会保存到 localStorage。
const settings = {
  language: "zh",
  keybinds: {
    moveForward: "W",
    moveBackward: "S",
    moveLeft: "A",
    moveRight: "D",
    jump: "Space",
    switchTopView: "Q",
    switchSideView: "E",
  },
};

// ===== 游戏状态与基础参数 =====
const pressedKeys = new Set();
const levelBlocks = [];
const viewModes = {
  SIDE: "side",
  TOP: "top",
};
const playerSize = { width: 1, height: 1, depth: 1 };
const physics = {
  gravity: -26,
  jumpSpeed: 11.5,
  moveSpeed: 7.2,
  groundAcceleration: 68,
  groundDeceleration: 86,
  airAcceleration: 28,
  airTurnAcceleration: 42,
  airDeceleration: 7,
  jumpForwardMinSpeed: 4.6,
  jumpBufferTime: 0.13,
  coyoteTime: 0.1,
  maxFallSpeed: -30,
};
const cameraDistance = 18;

// map.json 读取失败时使用这份备用地图，避免页面直接空白。
const fallbackMap = {
  spawn: { x: -5, y: 2.4 },
  camera: { height: 8 },
  blocks: [
    { x: 0, y: 0, w: 14, h: 1 },
    { x: 10, y: 1.2, w: 4, h: 0.7 },
    { x: 16, y: 2.4, w: 3.2, h: 0.7 },
    { x: 22, y: 1.2, w: 5, h: 0.7 },
    { x: 30, y: 2.1, w: 4, h: 0.7 },
    { x: 38, y: 0, w: 12, h: 1 },
  ],
};

let activeMap = fallbackMap;
let cameraHeight = fallbackMap.camera.height;
let gameStarted = false;
let gamePaused = false;
let viewMode = viewModes.SIDE;
let listeningAction = null;
let lastTime = performance.now();

loadSettings();

// ===== Three.js 场景初始化 =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0f14);
scene.fog = new THREE.Fog(0x0c0f14, 18, 54);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.set(0, 0, 18);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const ambientLight = new THREE.HemisphereLight(0xd8efff, 0x17100a, 1.65);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2);
keyLight.position.set(-5, 8, 8);
keyLight.castShadow = true;
scene.add(keyLight);

// ===== 玩家与地图材质 =====
const player = {
  mesh: new THREE.Mesh(
    new THREE.BoxGeometry(playerSize.width, playerSize.height, playerSize.depth),
    new THREE.MeshStandardMaterial({ color: 0xffcf56, roughness: 0.42 }),
  ),
  velocity: new THREE.Vector3(0, 0, 0),
  grounded: false,
  jumpBufferTimer: 0,
  coyoteTimer: 0,
};
player.mesh.castShadow = true;
scene.add(player.mesh);

const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x57d6ff, roughness: 0.66 });
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x283241, roughness: 0.82 });
const backLineMaterial = new THREE.LineBasicMaterial({ color: 0x243346, transparent: true, opacity: 0.5 });
const sideGuideLines = [];

// 背景水平线只负责给侧视角一点速度感和空间参照。
const clockLineGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-120, 0, -0.58),
  new THREE.Vector3(120, 0, -0.58),
]);

for (let y = -2; y <= 9; y += 1) {
  const line = new THREE.Line(clockLineGeometry, backLineMaterial);
  line.position.y = y;
  scene.add(line);
  sideGuideLines.push(line);
}

// ===== 启动流程 =====
resizeRenderer();
loadMap();
bindUi();
applyLanguage();
renderKeybinds();
animate();

// ===== UI 事件绑定 =====
function bindUi() {
  startButton.addEventListener("click", startGame);
  settingsButton.addEventListener("click", openSettings);
  gameSettingsButton.addEventListener("click", openSettings);
  gamePauseButton.addEventListener("click", pauseGame);
  resumeButton.addEventListener("click", resumeGame);
  quitButton.addEventListener("click", quitToMainMenu);
  closeSettingsButton.addEventListener("click", closeSettings);
  settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
      closeSettings();
    }
  });

  languageSelect.addEventListener("change", () => {
    settings.language = languageSelect.value;
    saveSettings();
    applyLanguage();
  });

  keybindButtons.forEach((button) => {
    button.addEventListener("click", () => {
      listeningAction = button.dataset.action;
      keybindButtons.forEach((item) => item.classList.remove("is-listening"));
      button.classList.add("is-listening");
      keybindHint.textContent = translations[settings.language].waitingForKey;
    });
  });

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", (event) => {
    const key = formatKey(event);
    if (gameStarted && isGameplayKey(key)) {
      event.preventDefault();
    }
    pressedKeys.delete(key);
  });
  window.addEventListener("resize", resizeRenderer);
}

// ===== 地图加载与构建 =====
async function loadMap() {
  try {
    const response = await fetch("./src/map.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Map request failed: ${response.status}`);
    }

    activeMap = await response.json();
  } catch (error) {
    console.warn("Using fallback map.", error);
    activeMap = fallbackMap;
  }

  cameraHeight = activeMap.camera?.height || fallbackMap.camera.height;
  buildMap(activeMap);
  resetPlayer();
  resizeRenderer();
}

function buildMap(mapData) {
  levelBlocks.forEach((block) => scene.remove(block.mesh));
  levelBlocks.length = 0;

  mapData.blocks.forEach((blockData) => {
    const block = normalizeBlock(blockData);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(block.w, block.h, block.d),
      getBlockMaterial(block),
    );
    mesh.position.set(block.x, block.y, block.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    levelBlocks.push({
      ...block,
      mesh,
    });
  });
}

function normalizeBlock(blockData) {
  return {
    x: blockData.x,
    y: blockData.y,
    z: blockData.z ?? 0,
    w: blockData.w,
    h: blockData.h,
    d: blockData.d ?? (blockData.y <= 0 ? 5 : 3),
  };
}

function getBlockMaterial(block) {
  return block.y <= 0 ? groundMaterial : blockMaterial;
}

// ===== 游戏开始与玩家重置 =====
function startGame() {
  gameStarted = true;
  gamePaused = false;
  startScreen.classList.add("is-hidden");
  gameSettingsButton.hidden = false;
  gamePauseButton.hidden = false;
  pauseModal.hidden = true;
  closeSettings();
}

function resetPlayer() {
  const spawn = activeMap.spawn || fallbackMap.spawn;
  player.mesh.position.set(spawn.x, spawn.y, 0);
  player.mesh.rotation.set(0, 0, 0);
  player.velocity.set(0, 0, 0);
  player.grounded = false;
  player.jumpBufferTimer = 0;
  player.coyoteTimer = 0;
  centerCameraOnPlayer();
}

// ===== 输入处理 =====
function handleKeyDown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    if (!settingsModal.hidden) {
      closeSettings();
      return;
    }

    togglePause();
    return;
  }

  if (listeningAction) {
    event.preventDefault();
    settings.keybinds[listeningAction] = formatKey(event);
    saveSettings();
    listeningAction = null;
    renderKeybinds();
    keybindHint.textContent = translations[settings.language].keybindHint;
    return;
  }

  if (!settingsModal.hidden) {
    return;
  }

  if (!gameStarted) {
    return;
  }

  const key = formatKey(event);

  if (isGameplayKey(key)) {
    event.preventDefault();
  }

  if (!event.repeat && key === settings.keybinds.switchTopView) {
    setViewMode(viewModes.TOP);
    return;
  }

  if (!event.repeat && key === settings.keybinds.switchSideView) {
    setViewMode(viewModes.SIDE);
    return;
  }

  if (!event.repeat && key === settings.keybinds.jump) {
    player.jumpBufferTimer = physics.jumpBufferTime;
  }

  pressedKeys.add(key);
}

// ===== 游戏模式、更新与镜头跟随 =====
function setViewMode(nextMode) {
  if (viewMode === nextMode) {
    return;
  }

  viewMode = nextMode;
  player.jumpBufferTimer = 0;
  player.coyoteTimer = 0;

  if (viewMode === viewModes.TOP) {
    player.velocity.y = 0;
  } else {
    player.velocity.z = 0;
    player.velocity.y = Math.min(player.velocity.y, 0);
    player.grounded = false;
  }

  updateViewHelpers();
  centerCameraOnPlayer();
}

function updateGame(deltaTime) {
  if (viewMode === viewModes.TOP) {
    updateTopView(deltaTime);
  } else {
    updateSideView(deltaTime);
  }

  centerCameraOnPlayer();
}

function updateSideView(deltaTime) {
  const leftPressed = isActionPressed("moveLeft") || isActionPressed("moveBackward");
  const rightPressed = isActionPressed("moveRight") || isActionPressed("moveForward");
  const horizontalInput = Number(rightPressed) - Number(leftPressed);

  if (player.grounded) {
    player.coyoteTimer = physics.coyoteTime;
  } else {
    player.coyoteTimer = Math.max(player.coyoteTimer - deltaTime, 0);
  }

  player.jumpBufferTimer = Math.max(player.jumpBufferTimer - deltaTime, 0);
  applySideHorizontalMovement(horizontalInput, deltaTime);

  if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
    player.velocity.y = physics.jumpSpeed;
    player.grounded = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;

    if (
      horizontalInput !== 0 &&
      Math.sign(player.velocity.x) !== -horizontalInput &&
      Math.abs(player.velocity.x) < physics.jumpForwardMinSpeed
    ) {
      player.velocity.x = horizontalInput * physics.jumpForwardMinSpeed;
    }
  }

  player.velocity.y = Math.max(player.velocity.y + physics.gravity * deltaTime, physics.maxFallSpeed);
  moveAndCollide(deltaTime);

  if (player.mesh.position.y < -8) {
    resetPlayer();
  }
}

function applySideHorizontalMovement(input, deltaTime) {
  const targetSpeed = input * physics.moveSpeed;

  if (input === 0) {
    const deceleration = player.grounded ? physics.groundDeceleration : physics.airDeceleration;
    player.velocity.x = moveToward(player.velocity.x, 0, deceleration * deltaTime);
    return;
  }

  const isTurningAround = Math.sign(player.velocity.x) === -input;
  const acceleration = player.grounded
    ? physics.groundAcceleration
    : isTurningAround
      ? physics.airTurnAcceleration
      : physics.airAcceleration;

  player.velocity.x = moveToward(player.velocity.x, targetSpeed, acceleration * deltaTime);
}

function updateTopView(deltaTime) {
  // 俯视模式保留侧视地图投影，只改变移动规则：无重力，直接在屏幕 X/Y 平面移动。
  const leftPressed = isActionPressed("moveLeft");
  const rightPressed = isActionPressed("moveRight");
  const forwardPressed = isActionPressed("moveForward");
  const backwardPressed = isActionPressed("moveBackward");

  player.velocity.x = (Number(rightPressed) - Number(leftPressed)) * physics.moveSpeed;
  player.velocity.y = (Number(forwardPressed) - Number(backwardPressed)) * physics.moveSpeed;
  player.velocity.z = 0;

  player.mesh.position.x += player.velocity.x * deltaTime;
  resolveTopCollisions("x");

  player.mesh.position.y += player.velocity.y * deltaTime;
  resolveTopCollisions("y");
}

function centerCameraOnPlayer() {
  camera.up.set(0, 1, 0);
  camera.position.set(
    player.mesh.position.x,
    player.mesh.position.y,
    player.mesh.position.z + cameraDistance,
  );

  camera.lookAt(player.mesh.position.x, player.mesh.position.y, player.mesh.position.z);
}

function updateViewHelpers() {
  sideGuideLines.forEach((line) => {
    line.visible = true;
  });
}

// ===== 简单 AABB 碰撞 =====
function moveAndCollide(deltaTime) {
  player.mesh.position.x += player.velocity.x * deltaTime;
  resolveCollisions("x");

  player.mesh.position.y += player.velocity.y * deltaTime;
  player.grounded = false;
  resolveCollisions("y");
}

function resolveCollisions(axis) {
  levelBlocks.forEach((block) => {
    if (!isOverlapping(player.mesh.position, block)) {
      return;
    }

    const halfPlayerWidth = playerSize.width / 2;
    const halfPlayerHeight = playerSize.height / 2;
    const blockLeft = block.x - block.w / 2;
    const blockRight = block.x + block.w / 2;
    const blockTop = block.y + block.h / 2;
    const blockBottom = block.y - block.h / 2;

    if (axis === "x") {
      if (player.velocity.x > 0) {
        player.mesh.position.x = blockLeft - halfPlayerWidth;
      } else if (player.velocity.x < 0) {
        player.mesh.position.x = blockRight + halfPlayerWidth;
      }
      player.velocity.x = 0;
      return;
    }

    if (player.velocity.y <= 0) {
      player.mesh.position.y = blockTop + halfPlayerHeight;
      player.grounded = true;
    } else {
      player.mesh.position.y = blockBottom - halfPlayerHeight;
    }
    player.velocity.y = 0;
  });
}

function resolveTopCollisions(axis) {
  levelBlocks.forEach((block) => {
    if (!isTopBlockingOverlap(player.mesh.position, block)) {
      return;
    }

    const bounds = getBlockBounds(block);
    const halfPlayerWidth = playerSize.width / 2;
    const halfPlayerHeight = playerSize.height / 2;

    if (axis === "x") {
      if (player.velocity.x > 0) {
        player.mesh.position.x = bounds.left - halfPlayerWidth;
      } else if (player.velocity.x < 0) {
        player.mesh.position.x = bounds.right + halfPlayerWidth;
      }
      player.velocity.x = 0;
      return;
    }

    if (player.velocity.y > 0) {
      player.mesh.position.y = bounds.bottom - halfPlayerHeight;
    } else if (player.velocity.y < 0) {
      player.mesh.position.y = bounds.top + halfPlayerHeight;
    }
    player.velocity.y = 0;
  });
}

function isOverlapping(position, block) {
  const playerBounds = getPlayerBounds(position);
  const blockBounds = getBlockBounds(block);

  return (
    playerBounds.right > blockBounds.left &&
    playerBounds.left < blockBounds.right &&
    playerBounds.top > blockBounds.bottom &&
    playerBounds.bottom < blockBounds.top &&
    playerBounds.back > blockBounds.front &&
    playerBounds.front < blockBounds.back
  );
}

function isTopBlockingOverlap(position, block) {
  return isOverlapping(position, block);
}

function getPlayerBounds(position) {
  return {
    left: position.x - playerSize.width / 2,
    right: position.x + playerSize.width / 2,
    bottom: position.y - playerSize.height / 2,
    top: position.y + playerSize.height / 2,
    front: position.z - playerSize.depth / 2,
    back: position.z + playerSize.depth / 2,
  };
}

function getBlockBounds(block) {
  return {
    left: block.x - block.w / 2,
    right: block.x + block.w / 2,
    bottom: block.y - block.h / 2,
    top: block.y + block.h / 2,
    front: block.z - block.d / 2,
    back: block.z + block.d / 2,
  };
}

function isActionPressed(action) {
  return pressedKeys.has(settings.keybinds[action]);
}

function isGameplayKey(key) {
  return Object.values(settings.keybinds).includes(key);
}

function moveToward(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }

  return current + Math.sign(target - current) * maxDelta;
}

// ===== 暂停菜单 =====
function pauseGame() {
  if (!gameStarted || gamePaused) {
    return;
  }

  pressedKeys.clear();
  gamePaused = true;
  pauseModal.hidden = false;
  resumeButton.focus();
}

function resumeGame() {
  pressedKeys.clear();
  gamePaused = false;
  pauseModal.hidden = true;
}

function togglePause() {
  if (!gameStarted) {
    return;
  }

  if (gamePaused) {
    resumeGame();
  } else {
    pauseGame();
  }
}

function quitToMainMenu() {
  gameStarted = false;
  gamePaused = false;
  pressedKeys.clear();
  pauseModal.hidden = true;
  gameSettingsButton.hidden = true;
  gamePauseButton.hidden = true;
  startScreen.classList.remove("is-hidden");
  viewMode = viewModes.SIDE;
  resetPlayer();
}

// ===== 设置弹窗 =====
function openSettings() {
  pressedKeys.clear();
  settingsModal.hidden = false;
  languageSelect.focus();
}

function closeSettings() {
  pressedKeys.clear();
  settingsModal.hidden = true;
  listeningAction = null;
  keybindButtons.forEach((button) => button.classList.remove("is-listening"));
  keybindHint.textContent = translations[settings.language].keybindHint;
}

// ===== 语言与设置存储 =====
function applyLanguage() {
  document.documentElement.lang = settings.language === "zh" ? "zh-CN" : "en";
  languageSelect.value = settings.language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = translations[settings.language][key];
  });
}

function loadSettings() {
  let savedSettings = null;

  try {
    savedSettings = JSON.parse(localStorage.getItem(settingsStorageKey) || "null");
  } catch {
    localStorage.removeItem(settingsStorageKey);
  }

  if (!savedSettings) {
    return;
  }

  if (savedSettings.language === "zh" || savedSettings.language === "en") {
    settings.language = savedSettings.language;
  }

  Object.keys(settings.keybinds).forEach((action) => {
    if (typeof savedSettings.keybinds?.[action] === "string") {
      settings.keybinds[action] = savedSettings.keybinds[action];
    }
  });
}

function saveSettings() {
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}

function renderKeybinds() {
  keybindButtons.forEach((button) => {
    button.textContent = settings.keybinds[button.dataset.action];
    button.classList.remove("is-listening");
  });
}

function formatKey(event) {
  if (event.code === "Space") {
    return "Space";
  }

  if (event.key.length === 1) {
    return event.key.toUpperCase();
  }

  return event.key;
}

// ===== 渲染尺寸与主循环 =====
function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  const halfHeight = cameraHeight / 2;
  const halfWidth = halfHeight * aspect;

  camera.left = -halfWidth;
  camera.right = halfWidth;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate(time = performance.now()) {
  requestAnimationFrame(animate);

  const deltaTime = Math.min((time - lastTime) / 1000, 1 / 30);
  lastTime = time;

  if (gameStarted && !gamePaused && settingsModal.hidden) {
    updateGame(deltaTime);
  }
  updateViewHelpers();
  renderer.render(scene, camera);
}
