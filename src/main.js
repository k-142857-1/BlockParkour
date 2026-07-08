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
const viewToast = document.querySelector("#view-toast");
const saveToast = document.querySelector("#save-toast");
const savePicker = document.querySelector("#save-picker");
const newGameButton = document.querySelector("#new-game-button");
const savedGameList = document.querySelector("#saved-game-list");
const settingsStorageKey = "3d-block-settings";
const progressStorageKey = "3d-block-progress-v1";

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
    topViewHint: "已切换到俯视视角",
    sideViewHint: "已切换到侧视视角",
    newGame: "新游戏",
    savedGames: "保存的游戏",
    saveLoaded: "已载入保存的游戏",
    progressSaved: "进度已保存",
    savedAt: "保存于",
    progressLabel: "进度",
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
    topViewHint: "Switched to top view",
    sideViewHint: "Switched to side view",
    newGame: "New Game",
    savedGames: "Saved Games",
    saveLoaded: "Saved game loaded",
    progressSaved: "Progress saved",
    savedAt: "Saved",
    progressLabel: "Progress",
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
const progressAutoSaveInterval = 8000;

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
let viewHintTimer = null;
let saveHintTimer = null;
let currentSaveId = null;
let lastProgressSaveTime = performance.now();

loadSettings();

// ===== Three.js 场景初始化 =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.Fog(0xffffff, 24, 72);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.set(0, 0, 18);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xffffff, 1);
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const ambientLight = new THREE.HemisphereLight(0xffffff, 0xdfe7ef, 1.45);
scene.add(ambientLight);

const shadowLightOffset = new THREE.Vector3(-7, 8, 44);
const shadowPlaneBaseSize = { width: 220, height: 96 };
const keyLight = new THREE.DirectionalLight(0xffffff, 2.35);
const keyLightTarget = new THREE.Object3D();
keyLight.position.copy(shadowLightOffset);
keyLight.castShadow = false;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 180;
keyLight.shadow.bias = -0.0003;
keyLight.target = keyLightTarget;
scene.add(keyLight);
scene.add(keyLightTarget);

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
player.mesh.castShadow = false;
scene.add(player.mesh);

const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x57d6ff, roughness: 0.66 });
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x283241, roughness: 0.82 });
const backLineMaterial = new THREE.LineBasicMaterial({ color: 0x243346, transparent: true, opacity: 0.5 });
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(shadowPlaneBaseSize.width, shadowPlaneBaseSize.height),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.34 }),
);
const sideGuideLines = [];

shadowPlane.position.set(30, 2, -2.8);
shadowPlane.receiveShadow = false;
shadowPlane.visible = false;
scene.add(shadowPlane);

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
updateViewPresentation();
animate();

// ===== UI 事件绑定 =====
function bindUi() {
  startButton.addEventListener("click", handleStartButtonClick);
  newGameButton.addEventListener("click", startNewGame);
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
  window.addEventListener("beforeunload", () => {
    if (gameStarted) {
      saveProgress({ showHint: false });
    }
  });
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
    scene.add(mesh);

    levelBlocks.push({
      ...block,
      mesh,
    });
  });

  updateShadowLayout();
  updateViewPresentation();
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
function handleStartButtonClick() {
  const savedGames = getSavedGames();

  if (savedGames.length === 0) {
    startNewGame();
    return;
  }

  renderSavedGameList(savedGames);
  savePicker.hidden = false;
  newGameButton.focus();
}

function startNewGame() {
  currentSaveId = getActiveSaveId();
  viewMode = viewModes.SIDE;
  closeSavePicker();
  resetPlayer();
  updateViewPresentation();
  beginGame();
  saveProgress({ showHint: false });
}

function startSavedGame(saveId) {
  const save = getSavedGame(saveId);

  if (!save) {
    startNewGame();
    return;
  }

  currentSaveId = save.id;
  closeSavePicker();
  applyProgressSave(save);
  beginGame();
  showSaveHint(translations[settings.language].saveLoaded);
}

function beginGame() {
  gameStarted = true;
  gamePaused = false;
  lastProgressSaveTime = performance.now();
  startScreen.classList.add("is-hidden");
  gameSettingsButton.hidden = false;
  gamePauseButton.hidden = false;
  pauseModal.hidden = true;
  closeSettings();
}

function closeSavePicker() {
  savePicker.hidden = true;
  savedGameList.replaceChildren();
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

  showViewHint(viewMode);
  updateViewPresentation();
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
  const jumpHeld = isActionPressed("jump");
  const horizontalInput = Number(rightPressed) - Number(leftPressed);

  if (player.grounded) {
    player.coyoteTimer = physics.coyoteTime;
  } else {
    player.coyoteTimer = Math.max(player.coyoteTimer - deltaTime, 0);
  }

  if (jumpHeld) {
    player.jumpBufferTimer = physics.jumpBufferTime;
  } else {
    player.jumpBufferTimer = Math.max(player.jumpBufferTimer - deltaTime, 0);
  }

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

function updateViewPresentation() {
  updateViewHelpers();
  updateShadowMode(viewMode === viewModes.TOP);
}

function updateShadowLayout() {
  if (levelBlocks.length === 0) {
    return;
  }

  const bounds = levelBlocks.reduce(
    (result, block) => ({
      left: Math.min(result.left, block.x - block.w / 2),
      right: Math.max(result.right, block.x + block.w / 2),
      bottom: Math.min(result.bottom, block.y - block.h / 2),
      top: Math.max(result.top, block.y + block.h / 2),
    }),
    {
      left: Infinity,
      right: -Infinity,
      bottom: Infinity,
      top: -Infinity,
    },
  );
  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.bottom + bounds.top) / 2;
  const layoutWidth = Math.max(bounds.right - bounds.left + 36, 96);
  const layoutHeight = Math.max(bounds.top - bounds.bottom + 36, 72);
  const shadowCameraSize = Math.max(layoutWidth, layoutHeight) * 1.45;

  shadowPlane.position.set(centerX, centerY, -2.8);
  shadowPlane.scale.set(
    layoutWidth / shadowPlaneBaseSize.width,
    layoutHeight / shadowPlaneBaseSize.height,
    1,
  );

  keyLightTarget.position.set(centerX, centerY, 0);
  keyLight.position.set(
    centerX + shadowLightOffset.x,
    centerY + shadowLightOffset.y,
    shadowLightOffset.z,
  );

  keyLight.shadow.camera.left = -shadowCameraSize / 2;
  keyLight.shadow.camera.right = shadowCameraSize / 2;
  keyLight.shadow.camera.top = shadowCameraSize / 2;
  keyLight.shadow.camera.bottom = -shadowCameraSize / 2;
  keyLight.shadow.camera.far = Math.max(180, shadowCameraSize + shadowLightOffset.length());
  keyLight.target.updateMatrixWorld();
  keyLight.shadow.camera.updateProjectionMatrix();
  keyLight.shadow.needsUpdate = true;
}

function updateShadowMode(isEnabled) {
  renderer.shadowMap.enabled = isEnabled;
  renderer.shadowMap.needsUpdate = true;
  keyLight.castShadow = isEnabled;
  player.mesh.castShadow = isEnabled;
  player.mesh.receiveShadow = isEnabled;
  shadowPlane.visible = isEnabled;
  shadowPlane.receiveShadow = isEnabled;

  levelBlocks.forEach((block) => {
    block.mesh.castShadow = isEnabled;
    block.mesh.receiveShadow = isEnabled;
  });
}

function showViewHint(nextMode) {
  window.clearTimeout(viewHintTimer);
  viewToast.textContent =
    nextMode === viewModes.TOP
      ? translations[settings.language].topViewHint
      : translations[settings.language].sideViewHint;
  viewToast.hidden = false;
  viewToast.classList.add("is-visible");

  viewHintTimer = window.setTimeout(() => {
    viewToast.classList.remove("is-visible");
    viewHintTimer = window.setTimeout(() => {
      viewToast.hidden = true;
    }, 200);
  }, 1200);
}

function hideViewHint() {
  window.clearTimeout(viewHintTimer);
  viewToast.classList.remove("is-visible");
  viewToast.hidden = true;
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
  saveProgress({ showHint: true });
  gameStarted = false;
  gamePaused = false;
  pressedKeys.clear();
  pauseModal.hidden = true;
  gameSettingsButton.hidden = true;
  gamePauseButton.hidden = true;
  startScreen.classList.remove("is-hidden");
  viewMode = viewModes.SIDE;
  hideViewHint();
  closeSavePicker();
  updateViewPresentation();
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

// ===== 进度存档 =====
function getSaveStore() {
  try {
    const store = JSON.parse(localStorage.getItem(progressStorageKey) || "null");

    if (store && typeof store === "object" && store.saves && typeof store.saves === "object") {
      return store;
    }
  } catch {
    localStorage.removeItem(progressStorageKey);
  }

  return { version: 1, saves: {} };
}

function writeSaveStore(store) {
  localStorage.setItem(progressStorageKey, JSON.stringify(store));
}

function getSavedGames() {
  return Object.values(getSaveStore().saves)
    .filter((save) => save && typeof save.id === "string")
    .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

function getSavedGame(saveId) {
  return getSaveStore().saves[saveId] || null;
}

function getActiveSaveId() {
  if (typeof activeMap.id === "string" && activeMap.id.trim()) {
    return activeMap.id.trim();
  }

  const mapSignature = JSON.stringify({
    spawn: activeMap.spawn || fallbackMap.spawn,
    blocks: activeMap.blocks || fallbackMap.blocks,
  });

  return `map-${hashString(mapSignature)}`;
}

function getActiveSaveName() {
  return activeMap.name || activeMap.title || "3D Block";
}

function renderSavedGameList(savedGames = getSavedGames()) {
  savedGameList.replaceChildren();

  savedGames.forEach((save) => {
    const button = document.createElement("button");
    const title = document.createElement("span");
    const meta = document.createElement("span");

    button.type = "button";
    button.className = "saved-game-button";
    button.addEventListener("click", () => startSavedGame(save.id));

    title.className = "saved-game-title";
    title.textContent = save.mapName || "3D Block";

    meta.className = "saved-game-meta";
    meta.textContent = `${translations[settings.language].savedAt} ${formatSaveTime(save.savedAt)} · ${
      translations[settings.language].progressLabel
    } ${formatProgress(save)}`;

    button.append(title, meta);
    savedGameList.append(button);
  });
}

function buildProgressSave() {
  const position = player.mesh.position;
  const velocity = player.velocity;

  return {
    id: currentSaveId || getActiveSaveId(),
    mapName: getActiveSaveName(),
    savedAt: Date.now(),
    viewMode,
    player: {
      position: { x: position.x, y: position.y, z: position.z },
      velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
      grounded: player.grounded,
    },
  };
}

function saveProgress({ showHint = true } = {}) {
  if (!gameStarted) {
    return false;
  }

  try {
    const store = getSaveStore();
    const save = buildProgressSave();

    currentSaveId = save.id;
    store.saves[save.id] = save;
    writeSaveStore(store);

    if (showHint) {
      showSaveHint(translations[settings.language].progressSaved);
    }

    return true;
  } catch (error) {
    console.warn("Unable to save progress.", error);
    return false;
  }
}

function maybeAutoSaveProgress(time) {
  if (time - lastProgressSaveTime < progressAutoSaveInterval) {
    return;
  }

  if (saveProgress({ showHint: true })) {
    lastProgressSaveTime = time;
  }
}

function applyProgressSave(save) {
  const position = save.player?.position;
  const velocity = save.player?.velocity;

  if (!position || !velocity) {
    resetPlayer();
    return;
  }

  viewMode = save.viewMode === viewModes.TOP ? viewModes.TOP : viewModes.SIDE;
  player.mesh.position.set(position.x, position.y, position.z ?? 0);
  player.velocity.set(velocity.x || 0, velocity.y || 0, velocity.z || 0);
  player.grounded = Boolean(save.player?.grounded);
  player.jumpBufferTimer = 0;
  player.coyoteTimer = 0;
  updateViewPresentation();
  centerCameraOnPlayer();
}

function showSaveHint(message) {
  window.clearTimeout(saveHintTimer);
  saveToast.textContent = message;
  saveToast.hidden = false;
  saveToast.classList.add("is-visible");

  saveHintTimer = window.setTimeout(() => {
    saveToast.classList.remove("is-visible");
    saveHintTimer = window.setTimeout(() => {
      saveToast.hidden = true;
    }, 200);
  }, 1200);
}

function formatSaveTime(savedAt) {
  const date = new Date(savedAt || Date.now());
  const locale = settings.language === "zh" ? "zh-CN" : "en";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatProgress(save) {
  const x = save.player?.position?.x;

  return Number.isFinite(x) ? `${Math.max(0, Math.round(x))}m` : "-";
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

// ===== 语言与设置存储 =====
function applyLanguage() {
  document.documentElement.lang = settings.language === "zh" ? "zh-CN" : "en";
  languageSelect.value = settings.language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = translations[settings.language][key];
  });

  if (!savePicker.hidden) {
    renderSavedGameList();
  }
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
    maybeAutoSaveProgress(time);
  }
  updateViewHelpers();
  renderer.render(scene, camera);
}
