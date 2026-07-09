import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

// ===== DOM 与菜单设置 =====
const canvas = document.querySelector("#game-canvas");
const adArea = document.querySelector("#ad-area");
const startScreen = document.querySelector("#start-screen");
const startButton = document.querySelector("#start-button");
const settingsButton = document.querySelector("#settings-button");
const supportButton = document.querySelector("#support-button");
const gameSettingsButton = document.querySelector("#game-settings-button");
const gamePauseButton = document.querySelector("#game-pause-button");
const pauseModal = document.querySelector("#pause-modal");
const resumeButton = document.querySelector("#resume-button");
const quitButton = document.querySelector("#quit-button");
const settingsModal = document.querySelector("#settings-modal");
const closeSettingsButton = document.querySelector("#close-settings-button");
const supportModal = document.querySelector("#support-modal");
const closeSupportButton = document.querySelector("#close-support-button");
const supportAmountButtons = document.querySelectorAll(".support-amount");
const supportPayButton = document.querySelector("#support-pay-button");
const supportPaymentHint = document.querySelector("#support-payment-hint");
const languageSelect = document.querySelector("#language-select");
const viewToast = document.querySelector("#view-toast");
const saveToast = document.querySelector("#save-toast");
const savePicker = document.querySelector("#save-picker");
const newGameButton = document.querySelector("#new-game-button");
const savedGameList = document.querySelector("#saved-game-list");
const gemHud = document.querySelector("#gem-hud");
const sideToTopCount = document.querySelector("#side-to-top-count");
const topToSideCount = document.querySelector("#top-to-side-count");
const sideToTopGemButton = document.querySelector("#side-to-top-gem-button");
const topToSideGemButton = document.querySelector("#top-to-side-gem-button");
const touchControls = document.querySelector("#touch-controls");
const joystickControl = document.querySelector("#joystick-control");
const joystickBase = document.querySelector("#joystick-base");
const joystickKnob = document.querySelector("#joystick-knob");
const jumpButton = document.querySelector("#jump-button");
const keybindSettings = document.querySelector("#keybind-settings");
const keybindButtons = document.querySelectorAll("[data-keybind]");
const controlLayoutSettings = document.querySelector("#control-layout-settings");
const arrangeControlsButton = document.querySelector("#arrange-controls-button");
const controlLayoutToolbar = document.querySelector("#control-layout-toolbar");
const resetControlsButton = document.querySelector("#reset-controls-button");
const saveControlsButton = document.querySelector("#save-controls-button");
const settingsStorageKey = "3d-block-settings";
const progressStorageKey = "3d-block-progress-v1";
// 填入收款平台生成的金额专属链接；不要在前端存放商户密钥。
const supportPaymentLinks = {
	"0.1": "",
	"0.5": "",
};

// 界面文案集中放在这里，后面继续加语言时比较好维护。
const translations = {
	zh: {
		subtitle: "一个 3D 方块游戏。",
		startGame: "开始游戏",
		settings: "设置",
		settingsTitle: "设置",
		language: "语言",
		keybinds: "键位设置",
		moveForward: "前进",
		moveBackward: "后退",
		moveLeft: "左移",
		moveRight: "右移",
		jump: "跳跃",
		switchTopView: "切换视角",
		returnToCheckpoint: "回到存档点",
		pressKey: "按下新键",
		controlLayout: "按键摆放",
		controlLayoutHint: "进入调整模式后，可拖动摇杆、跳跃键和宝石栏。",
		arrangeControls: "调整按键摆放",
		dragControls: "拖动按键调整位置",
		resetLayout: "恢复默认",
		saveLayout: "完成",
		supportUs: "支持我们",
		supportTitle: "支持我们",
		supportDescription: "选择一个金额支持我们。",
		payNow: "支付",
		paymentUnavailable: "暂时无法支付，请稍后再试。",
		pauseTitle: "暂停",
		resumeGame: "继续",
		quitToMenu: "退出到主界面",
		topViewHint: "已切换到俯视视角",
		sideViewHint: "已切换到侧视视角",
		newGame: "新游戏",
		savedGames: "保存的游戏",
		saveLoaded: "已载入保存的游戏",
		progressSaved: "进度已保存",
		savedAt: "保存于",
		progressLabel: "进度",
		deleteSave: "删除存档",
		notEnoughGems: "对应宝石不足",
		checkpointReached: "已到达存档点",
		returnedToCheckpoint: "已返回存档点",
	},
	en: {
		subtitle: "A 3D block game.",
		startGame: "Start Game",
		settings: "Settings",
		settingsTitle: "Settings",
		language: "Language",
		keybinds: "Keybinds",
		moveForward: "Move Forward",
		moveBackward: "Move Backward",
		moveLeft: "Move Left",
		moveRight: "Move Right",
		jump: "Jump",
		switchTopView: "Switch View",
		returnToCheckpoint: "Checkpoint",
		pressKey: "Press key",
		controlLayout: "Control Layout",
		controlLayoutHint: "Drag the joystick, jump button, and gem bar in layout mode.",
		arrangeControls: "Arrange Controls",
		dragControls: "Drag controls to reposition",
		resetLayout: "Reset",
		saveLayout: "Done",
		supportUs: "Support Us",
		supportTitle: "Support Us",
		supportDescription: "Choose an amount to support us.",
		payNow: "Pay",
		paymentUnavailable: "Payment is temporarily unavailable. Please try again later.",
		pauseTitle: "Paused",
		resumeGame: "Resume",
		quitToMenu: "Quit to Menu",
		topViewHint: "Switched to top view",
		sideViewHint: "Switched to side view",
		newGame: "New Game",
		savedGames: "Saved Games",
		saveLoaded: "Saved game loaded",
		progressSaved: "Progress saved",
		savedAt: "Saved",
		progressLabel: "Progress",
		deleteSave: "Delete save",
		notEnoughGems: "Need the matching gem",
		checkpointReached: "Checkpoint reached",
		returnedToCheckpoint: "Returned to checkpoint",
	},
};

const defaultControlLayout = {
	joystick: { x: 0.16, y: 0.78 },
	jump: { x: 0.82, y: 0.7 },
	gems: { x: 0.82, y: 0.88 },
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
		switchSideView: "Q",
		returnToCheckpoint: "R",
	},
	controlLayout: cloneControlLayout(defaultControlLayout),
};

// ===== 游戏状态与基础参数 =====
const pressedKeys = new Set();
const touchInput = { x: 0, y: 0, jump: false };
const touchMediaQuery = window.matchMedia("(pointer: coarse)");
const finePointerMediaQuery = window.matchMedia("(pointer: fine)");
const levelBlocks = [];
const levelGems = [];
const levelCheckpoints = [];
const viewModes = {
	SIDE: "side",
	TOP: "top",
};
const gemTypes = {
	SIDE_TO_TOP: "sideToTop",
	TOP_TO_SIDE: "topToSide",
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
const gemSize = 0.78;
const checkpointSize = 1.12;

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
	gems: [
		{ id: "side-to-top-1", type: gemTypes.SIDE_TO_TOP, x: 3, y: 1.2 },
		{ id: "top-to-side-1", type: gemTypes.TOP_TO_SIDE, x: 10, y: 2.25 },
	],
	checkpoints: [
		{ id: "checkpoint-1", x: 7.4, y: 2.15 },
	],
};

let activeMap = fallbackMap;
let cameraHeight = fallbackMap.camera.height;
let gameStarted = false;
let gamePaused = false;
let viewMode = viewModes.SIDE;
let touchEnabled = touchMediaQuery.matches || navigator.maxTouchPoints > 0;
let joystickPointerId = null;
let jumpPointerId = null;
let layoutEditing = false;
let layoutDrag = null;
let keybindListeningAction = null;
let selectedSupportAmount = "0.1";
let lastTime = performance.now();
let viewHintTimer = null;
let saveHintTimer = null;
let currentSaveId = null;
let lastProgressSaveTime = performance.now();
let gemInventory = {
	[gemTypes.SIDE_TO_TOP]: 0,
	[gemTypes.TOP_TO_SIDE]: 0,
};
let collectedGemIds = new Set();
let activatedCheckpointIds = new Set();
let lastCheckpoint = null;

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

const textureLoader = new THREE.TextureLoader();
const textures = {
	player: loadGameTexture("./src/player.svg"),
	sideToTopGem: loadGameTexture("./src/gem-side-to-top.svg"),
	topToSideGem: loadGameTexture("./src/gem-top-to-side.svg"),
	checkpoint: loadGameTexture("./src/checkpoint.svg"),
	unactCheckpoint: loadGameTexture("./src/unact_checkpoint.svg")
};

// ===== 玩家与地图材质 =====
const player = {
	mesh: new THREE.Mesh(
		new THREE.BoxGeometry(playerSize.width, playerSize.height, playerSize.depth),
		new THREE.MeshStandardMaterial({ color: 0xffffff, map: textures.player, roughness: 0.42 }),
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
initializeTouchControls();
updateViewPresentation();
animate();

// ===== UI 事件绑定 =====
function bindUi() {
	startButton.addEventListener("click", handleStartButtonClick);
	newGameButton.addEventListener("click", startNewGame);
	settingsButton.addEventListener("click", openSettings);
	supportButton.addEventListener("click", openSupportModal);
	gameSettingsButton.addEventListener("click", openSettings);
	gamePauseButton.addEventListener("click", pauseGame);
	resumeButton.addEventListener("click", resumeGame);
	quitButton.addEventListener("click", quitToMainMenu);
	closeSettingsButton.addEventListener("click", closeSettings);
	closeSupportButton.addEventListener("click", closeSupportModal);
	settingsModal.addEventListener("click", (event) => {
		if (event.target === settingsModal) {
			closeSettings();
		}
	});
	supportModal.addEventListener("click", (event) => {
		if (event.target === supportModal) {
			closeSupportModal();
		}
	});
	supportAmountButtons.forEach((button) => {
		button.addEventListener("click", () => selectSupportAmount(button.dataset.amount));
	});
	supportPayButton.addEventListener("click", openSupportPayment);

	languageSelect.addEventListener("change", () => {
		settings.language = languageSelect.value;
		saveSettings();
		applyLanguage();
	});
	keybindButtons.forEach((button) => {
		button.addEventListener("click", () => startKeybindListening(button.dataset.keybind));
	});

	sideToTopGemButton.addEventListener("click", () => {
		if (!layoutEditing && gameStarted && !gamePaused) {
			setViewMode(viewModes.TOP);
		}
	});
	topToSideGemButton.addEventListener("click", () => {
		if (!layoutEditing && gameStarted && !gamePaused) {
			setViewMode(viewModes.SIDE);
		}
	});
	arrangeControlsButton.addEventListener("click", startControlLayoutEditing);
	resetControlsButton.addEventListener("click", resetControlLayout);
	saveControlsButton.addEventListener("click", finishControlLayoutEditing);

	joystickControl.addEventListener("pointerdown", handleJoystickPointerDown);
	joystickControl.addEventListener("pointermove", handleJoystickPointerMove);
	joystickControl.addEventListener("pointerup", handleJoystickPointerEnd);
	joystickControl.addEventListener("pointercancel", handleJoystickPointerEnd);
	jumpButton.addEventListener("pointerdown", handleJumpPointerDown);
	jumpButton.addEventListener("pointerup", handleJumpPointerEnd);
	jumpButton.addEventListener("pointercancel", handleJumpPointerEnd);
	gemHud.addEventListener("pointerdown", (event) => {
		if (layoutEditing) {
			startLayoutDrag(event, "gems", gemHud);
		}
	});
	window.addEventListener("pointermove", updateLayoutDrag);
	window.addEventListener("pointerup", endLayoutDrag);
	window.addEventListener("pointercancel", endLayoutDrag);

	window.addEventListener("keydown", handleKeyDown);
	window.addEventListener("keyup", (event) => {
		const key = formatKey(event);
		if (gameStarted && isGameplayKey(key) && !hasCommandModifier(event)) {
			event.preventDefault();
		}
		pressedKeys.delete(key);
	});
	window.addEventListener("resize", () => {
		resizeRenderer();
		applyControlLayout();
	});
	touchMediaQuery.addEventListener("change", updateTouchCapability);
	finePointerMediaQuery.addEventListener("change", updateSettingsPanels);
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
	levelGems.forEach((gem) => scene.remove(gem.mesh));
	levelCheckpoints.forEach((checkpoint) => scene.remove(checkpoint.mesh));
	levelBlocks.length = 0;
	levelGems.length = 0;
	levelCheckpoints.length = 0;

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

	buildGems(mapData.gems || fallbackMap.gems || []);
	buildCheckpoints(mapData.checkpoints || fallbackMap.checkpoints || []);
	updateShadowLayout();
	updateViewPresentation();
}

function buildGems(gems) {
	gems.forEach((gemData, index) => {
		const gem = normalizeGem(gemData, index);
		const material = new THREE.SpriteMaterial({
			map: getGemTexture(gem.type),
			transparent: true,
			depthWrite: false,
		});
		const mesh = new THREE.Sprite(material);

		mesh.position.set(gem.x, gem.y, gem.z);
		mesh.scale.set(gemSize, gemSize, 1);
		scene.add(mesh);

		levelGems.push({
			...gem,
			mesh,
		});
	});

	refreshGemVisibility();
}

function buildCheckpoints(checkpoints) {
	checkpoints.forEach((checkpointData, index) => {
		const checkpoint = normalizeCheckpoint(checkpointData, index);
		const material = new THREE.SpriteMaterial({
			map: textures.unactCheckpoint,
			transparent: true,
			depthWrite: false,
		});
		const mesh = new THREE.Sprite(material);

		mesh.position.set(checkpoint.x, checkpoint.y, checkpoint.z);
		mesh.scale.set(checkpointSize, checkpointSize, 1);
		scene.add(mesh);

		levelCheckpoints.push({
			...checkpoint,
			mesh,
		});
	});

	refreshCheckpointStates();
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

function normalizeGem(gemData, index) {
	const type =
		gemData.type === gemTypes.TOP_TO_SIDE ? gemTypes.TOP_TO_SIDE : gemTypes.SIDE_TO_TOP;

	return {
		id: gemData.id || `${type}-${index + 1}`,
		type,
		x: gemData.x,
		y: gemData.y,
		z: gemData.z ?? 0.8,
	};
}

function normalizeCheckpoint(checkpointData, index) {
	return {
		id: checkpointData.id || `checkpoint-${index + 1}`,
		progressIndex: Number.isFinite(checkpointData.progress) ? checkpointData.progress : index,
		x: checkpointData.x,
		y: checkpointData.y,
		z: checkpointData.z ?? 0.9,
	};
}

function refreshCheckpointStates() {
	levelCheckpoints.forEach((checkpoint) => {
		const texture = activatedCheckpointIds.has(checkpoint.id)
			? textures.checkpoint
			: textures.unactCheckpoint;

		if (checkpoint.mesh.material.map !== texture) {
			checkpoint.mesh.material.map = texture;
			checkpoint.mesh.material.needsUpdate = true;
		}
	});
}

function getBlockMaterial(block) {
	return block.y <= 0 ? groundMaterial : blockMaterial;
}

function getGemTexture(type) {
	return type === gemTypes.TOP_TO_SIDE ? textures.topToSideGem : textures.sideToTopGem;
}

function loadGameTexture(path) {
	const texture = textureLoader.load(path);

	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;

	return texture;
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
	resetGemState();
	resetCheckpointState();
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
	gemHud.hidden = false;
	pauseModal.hidden = true;
	closeSettings();
	updateTouchControlsVisibility();
	updateGemHud();
}

function closeSavePicker() {
	savePicker.hidden = true;
	savedGameList.replaceChildren();
}

function openSupportModal() {
	supportPaymentHint.textContent = "";
	supportModal.hidden = false;
	updateSupportPayment();
	supportAmountButtons[0].focus();
}

function closeSupportModal() {
	supportModal.hidden = true;
	supportPaymentHint.textContent = "";
	supportButton.focus();
}

function selectSupportAmount(amount) {
	if (!(amount in supportPaymentLinks)) {
		return;
	}

	selectedSupportAmount = amount;
	supportPaymentHint.textContent = "";
	updateSupportPayment();
}

function updateSupportPayment() {
	supportAmountButtons.forEach((button) => {
		const isSelected = button.dataset.amount === selectedSupportAmount;

		button.classList.toggle("is-selected", isSelected);
		button.setAttribute("aria-pressed", String(isSelected));
	});
	supportPayButton.textContent = `${translations[settings.language].payNow} ¥${Number(
		selectedSupportAmount,
	).toFixed(2)}`;
}

function openSupportPayment() {
	const paymentUrl = supportPaymentLinks[selectedSupportAmount];

	if (!paymentUrl) {
		supportPaymentHint.textContent = translations[settings.language].paymentUnavailable;
		return;
	}

	window.open(paymentUrl, "_blank", "noopener,noreferrer");
}

function resetPlayer() {
	const spawn = activeMap.spawn || fallbackMap.spawn;
	const checkpoint = lastCheckpoint || { x: spawn.x, y: spawn.y, z: 0, viewMode: viewModes.SIDE };

	viewMode = checkpoint.viewMode === viewModes.TOP ? viewModes.TOP : viewModes.SIDE;
	player.mesh.position.set(checkpoint.x, checkpoint.y, checkpoint.z ?? 0);
	player.mesh.rotation.set(0, 0, 0);
	player.velocity.set(0, 0, 0);
	player.grounded = false;
	player.jumpBufferTimer = 0;
	player.coyoteTimer = 0;
	updateViewPresentation();
	centerCameraOnPlayer();
}

function resetCheckpointState() {
	const spawn = activeMap.spawn || fallbackMap.spawn;

	activatedCheckpointIds = new Set();
	lastCheckpoint = {
		id: "spawn",
		progressIndex: -1,
		x: spawn.x,
		y: spawn.y,
		z: 0,
		viewMode: viewModes.SIDE,
	};
	refreshCheckpointStates();
}

// ===== 触控与按键摆放 =====
function initializeTouchControls() {
	document.body.classList.toggle("touch-enabled", touchEnabled);
	applyControlLayout();
	updateTouchControlsVisibility();
	updateSettingsPanels();
}

function updateTouchCapability() {
	touchEnabled = touchMediaQuery.matches || navigator.maxTouchPoints > 0;
	document.body.classList.toggle("touch-enabled", touchEnabled);
	updateTouchControlsVisibility();
	updateSettingsPanels();
	applyControlLayout();
}

function updateTouchControlsVisibility() {
	const shouldShow = layoutEditing || (gameStarted && touchEnabled);

	touchControls.hidden = !shouldShow;
	if (!layoutEditing && !gameStarted) {
		gemHud.hidden = true;
	}

	if (shouldShow) {
		applyControlLayout();
	}
}

function handleJoystickPointerDown(event) {
	event.preventDefault();

	if (layoutEditing) {
		startLayoutDrag(event, "joystick", joystickControl);
		return;
	}

	if (!gameStarted || gamePaused || joystickPointerId !== null) {
		return;
	}

	joystickPointerId = event.pointerId;
	joystickControl.setPointerCapture(event.pointerId);
	updateJoystickInput(event);
}

function handleJoystickPointerMove(event) {
	if (event.pointerId === joystickPointerId) {
		updateJoystickInput(event);
	}
}

function handleJoystickPointerEnd(event) {
	if (event.pointerId !== joystickPointerId) {
		return;
	}

	joystickPointerId = null;
	touchInput.x = 0;
	touchInput.y = 0;
	joystickKnob.style.transform = "translate(-50%, -50%)";
}

function updateJoystickInput(event) {
	const bounds = joystickBase.getBoundingClientRect();
	const centerX = bounds.left + bounds.width / 2;
	const centerY = bounds.top + bounds.height / 2;
	const maxDistance = bounds.width * 0.31;
	const deltaX = event.clientX - centerX;
	const deltaY = event.clientY - centerY;
	const distance = Math.hypot(deltaX, deltaY);
	const scale = distance > maxDistance ? maxDistance / distance : 1;
	const offsetX = deltaX * scale;
	const offsetY = deltaY * scale;

	touchInput.x = offsetX / maxDistance;
	touchInput.y = -offsetY / maxDistance;
	joystickKnob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
}

function handleJumpPointerDown(event) {
	event.preventDefault();

	if (layoutEditing) {
		startLayoutDrag(event, "jump", jumpButton);
		return;
	}

	if (!gameStarted || gamePaused || jumpPointerId !== null) {
		return;
	}

	jumpPointerId = event.pointerId;
	jumpButton.setPointerCapture(event.pointerId);
	touchInput.jump = true;
	player.jumpBufferTimer = physics.jumpBufferTime;
	jumpButton.classList.add("is-pressed");
}

function handleJumpPointerEnd(event) {
	if (event.pointerId !== jumpPointerId) {
		return;
	}

	jumpPointerId = null;
	touchInput.jump = false;
	jumpButton.classList.remove("is-pressed");
}

function resetTouchInput() {
	joystickPointerId = null;
	jumpPointerId = null;
	touchInput.x = 0;
	touchInput.y = 0;
	touchInput.jump = false;
	joystickKnob.style.transform = "translate(-50%, -50%)";
	jumpButton.classList.remove("is-pressed");
}

function startControlLayoutEditing() {
	closeSettings();
	layoutEditing = true;
	layoutDrag = null;
	resetTouchInput();
	document.body.classList.add("is-arranging");
	controlLayoutToolbar.hidden = false;
	touchControls.hidden = false;
	gemHud.hidden = false;
	applyControlLayout();
	updateGemHud();
}

function finishControlLayoutEditing() {
	layoutEditing = false;
	layoutDrag = null;
	document.body.classList.remove("is-arranging");
	controlLayoutToolbar.hidden = true;
	saveSettings();
	resetTouchInput();
	gemHud.hidden = !gameStarted;
	updateTouchControlsVisibility();
	updateGemHud();
}

function resetControlLayout() {
	settings.controlLayout = cloneControlLayout(defaultControlLayout);
	applyControlLayout();
}

function startLayoutDrag(event, controlName, element) {
	event.preventDefault();
	event.stopPropagation();

	const bounds = element.getBoundingClientRect();

	layoutDrag = {
		controlName,
		element,
		pointerId: event.pointerId,
		offsetX: event.clientX - (bounds.left + bounds.width / 2),
		offsetY: event.clientY - (bounds.top + bounds.height / 2),
	};
}

function updateLayoutDrag(event) {
	if (!layoutDrag || event.pointerId !== layoutDrag.pointerId) {
		return;
	}

	event.preventDefault();
	const bounds = layoutDrag.element.getBoundingClientRect();
	const gameViewportHeight = getGameViewportHeight();
	const edgePadding = 10;
	const toolbarPadding = controlLayoutToolbar.getBoundingClientRect().bottom + 10;
	const minX = bounds.width / 2 + edgePadding;
	const maxX = window.innerWidth - bounds.width / 2 - edgePadding;
	const minY = Math.max(bounds.height / 2 + edgePadding, toolbarPadding);
	const maxY = Math.max(minY, gameViewportHeight - bounds.height / 2 - edgePadding);
	const centerX = clamp(event.clientX - layoutDrag.offsetX, minX, maxX);
	const centerY = clamp(event.clientY - layoutDrag.offsetY, minY, maxY);

	settings.controlLayout[layoutDrag.controlName] = {
		x: centerX / window.innerWidth,
		y: centerY / gameViewportHeight,
	};
	applyControlLayout();
}

function endLayoutDrag(event) {
	if (layoutDrag && event.pointerId === layoutDrag.pointerId) {
		layoutDrag = null;
	}
}

function applyControlLayout() {
	positionTouchControl(joystickControl, settings.controlLayout.joystick);
	positionTouchControl(jumpButton, settings.controlLayout.jump);

	if (touchEnabled || layoutEditing) {
		positionTouchControl(gemHud, settings.controlLayout.gems);
	} else {
		gemHud.style.removeProperty("left");
		gemHud.style.removeProperty("top");
	}
}

function positionTouchControl(element, position) {
	const gameViewportHeight = getGameViewportHeight();
	const halfWidth = element.offsetWidth / 2;
	const halfHeight = element.offsetHeight / 2;
	const edgePadding = 10;
	const minX = (halfWidth + edgePadding) / window.innerWidth;
	const maxX = 1 - minX;
	const minY = (halfHeight + edgePadding) / gameViewportHeight;
	const maxY = 1 - minY;
	const x = clamp(position.x, minX, maxX);
	const y = clamp(position.y, minY, maxY);

	element.style.left = `${x * 100}%`;
	element.style.top = `${y * gameViewportHeight}px`;
}

function cloneControlLayout(layout) {
	return {
		joystick: { ...layout.joystick },
		jump: { ...layout.jump },
		gems: { ...layout.gems },
	};
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function getGameViewportHeight() {
	return Math.max(1, window.innerHeight - adArea.offsetHeight);
}

// ===== 输入处理 =====
function handleKeyDown(event) {
	if (event.key === "Escape") {
		event.preventDefault();
		if (keybindListeningAction) {
			cancelKeybindListening();
			return;
		}

		if (layoutEditing) {
			finishControlLayoutEditing();
			return;
		}

		if (!supportModal.hidden) {
			closeSupportModal();
			return;
		}

		if (!settingsModal.hidden) {
			closeSettings();
			return;
		}

		togglePause();
		return;
	}

	if (!settingsModal.hidden) {
		handleKeybindInput(event);
		return;
	}

	if (!gameStarted) {
		return;
	}

	const key = formatKey(event);

	if (hasCommandModifier(event)) {
		return;
	}

	if (isGameplayKey(key)) {
		event.preventDefault();
	}

	if (!event.repeat && isViewSwitchKey(key)) {
		toggleViewMode();
		return;
	}

	if (!event.repeat && key === settings.keybinds.returnToCheckpoint) {
		returnToCheckpoint();
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

	const requiredGem = getRequiredGemForViewSwitch(nextMode);

	if (!consumeGem(requiredGem)) {
		showViewHint(null, translations[settings.language].notEnoughGems);
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
	saveProgress({ showHint: false });
}

function getRequiredGemForViewSwitch(nextMode) {
	return nextMode === viewModes.TOP ? gemTypes.SIDE_TO_TOP : gemTypes.TOP_TO_SIDE;
}

function toggleViewMode() {
	setViewMode(viewMode === viewModes.TOP ? viewModes.SIDE : viewModes.TOP);
}

function consumeGem(type) {
	if (gemInventory[type] <= 0) {
		return false;
	}

	gemInventory[type] -= 1;
	updateGemHud();

	return true;
}

function updateGame(deltaTime) {
	if (viewMode === viewModes.TOP) {
		updateTopView(deltaTime);
	} else {
		updateSideView(deltaTime);
	}

	collectGems();
	activateCheckpoints();
	centerCameraOnPlayer();
}

function updateSideView(deltaTime) {
	const leftPressed = isActionPressed("moveLeft") || isActionPressed("moveBackward");
	const rightPressed = isActionPressed("moveRight") || isActionPressed("moveForward");
	const jumpHeld = isActionPressed("jump");
	const keyboardInput = Number(rightPressed) - Number(leftPressed);
	const horizontalInput = Math.abs(touchInput.x) > 0.12 ? touchInput.x : keyboardInput;

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
	const keyboardX = Number(rightPressed) - Number(leftPressed);
	const keyboardY = Number(forwardPressed) - Number(backwardPressed);
	const inputX = Math.abs(touchInput.x) > 0.12 ? touchInput.x : keyboardX;
	const inputY = Math.abs(touchInput.y) > 0.12 ? touchInput.y : keyboardY;

	player.velocity.x = inputX * physics.moveSpeed;
	player.velocity.y = inputY * physics.moveSpeed;
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
	updateGemHud();
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

function showViewHint(nextMode, message = "") {
	window.clearTimeout(viewHintTimer);
	viewToast.textContent =
		message ||
		(nextMode === viewModes.TOP
			? translations[settings.language].topViewHint
			: translations[settings.language].sideViewHint);
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

function collectGems() {
	levelGems.forEach((gem) => {
		if (collectedGemIds.has(gem.id) || !isGemOverlapping(gem)) {
			return;
		}

		collectedGemIds.add(gem.id);
		gemInventory[gem.type] += 1;
		gem.mesh.visible = false;
		updateGemHud();
		saveProgress({ showHint: false });
	});
}

function activateCheckpoints() {
	levelCheckpoints.forEach((checkpoint) => {
		if (!isCheckpointOverlapping(checkpoint)) {
			return;
		}

		const isNewlyActivated = !activatedCheckpointIds.has(checkpoint.id);

		if (isNewlyActivated) {
			activatedCheckpointIds.add(checkpoint.id);
			refreshCheckpointStates();
		}

		const currentProgressIndex = Number.isFinite(lastCheckpoint?.progressIndex)
			? lastCheckpoint.progressIndex
			: getCheckpointProgressIndex(lastCheckpoint?.id);

		if (checkpoint.progressIndex <= currentProgressIndex) {
			if (isNewlyActivated) {
				saveProgress({ showHint: false });
			}
			return;
		}

		lastCheckpoint = {
			id: checkpoint.id,
			progressIndex: checkpoint.progressIndex,
			x: checkpoint.x,
			y: checkpoint.y,
			z: 0,
			viewMode,
		};

		showSaveHint(translations[settings.language].checkpointReached);
		saveProgress({ showHint: false });
	});
}

function returnToCheckpoint() {
	if (!lastCheckpoint) {
		resetCheckpointState();
	}

	resetPlayer();
	showSaveHint(translations[settings.language].returnedToCheckpoint);
	saveProgress({ showHint: false });
}

function isGemOverlapping(gem) {
	const playerBounds = getPlayerBounds(player.mesh.position);
	const halfGem = gemSize / 2;

	return (
		playerBounds.right > gem.x - halfGem &&
		playerBounds.left < gem.x + halfGem &&
		playerBounds.top > gem.y - halfGem &&
		playerBounds.bottom < gem.y + halfGem &&
		playerBounds.back > gem.z - halfGem &&
		playerBounds.front < gem.z + halfGem
	);
}

function isCheckpointOverlapping(checkpoint) {
	const playerBounds = getPlayerBounds(player.mesh.position);
	const halfCheckpoint = checkpointSize / 2;

	return (
		playerBounds.right > checkpoint.x - halfCheckpoint &&
		playerBounds.left < checkpoint.x + halfCheckpoint &&
		playerBounds.top > checkpoint.y - halfCheckpoint &&
		playerBounds.bottom < checkpoint.y + halfCheckpoint &&
		playerBounds.back > checkpoint.z - halfCheckpoint &&
		playerBounds.front < checkpoint.z + halfCheckpoint
	);
}

function resetGemState() {
	gemInventory = {
		[gemTypes.SIDE_TO_TOP]: 0,
		[gemTypes.TOP_TO_SIDE]: 0,
	};
	collectedGemIds = new Set();
	refreshGemVisibility();
	updateGemHud();
}

function refreshGemVisibility() {
	levelGems.forEach((gem) => {
		gem.mesh.visible = !collectedGemIds.has(gem.id);
	});
}

function updateGemHud() {
	sideToTopCount.textContent = String(gemInventory[gemTypes.SIDE_TO_TOP]);
	topToSideCount.textContent = String(gemInventory[gemTypes.TOP_TO_SIDE]);
	sideToTopGemButton.disabled = !layoutEditing && viewMode === viewModes.TOP;
	topToSideGemButton.disabled = !layoutEditing && viewMode === viewModes.SIDE;
}

function isActionPressed(action) {
	if (action === "jump" && touchInput.jump) {
		return true;
	}

	if (action === "moveLeft" && touchInput.x < -0.12) {
		return true;
	}

	if (action === "moveRight" && touchInput.x > 0.12) {
		return true;
	}

	if (action === "moveForward" && touchInput.y > 0.12) {
		return true;
	}

	if (action === "moveBackward" && touchInput.y < -0.12) {
		return true;
	}

	return pressedKeys.has(settings.keybinds[action]);
}

function isGameplayKey(key) {
	return Object.values(settings.keybinds).includes(key);
}

function isViewSwitchKey(key) {
	return key === settings.keybinds.switchTopView || key === settings.keybinds.switchSideView;
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
	resetTouchInput();
	gamePaused = true;
	pauseModal.hidden = false;
	resumeButton.focus();
}

function resumeGame() {
	pressedKeys.clear();
	resetTouchInput();
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
	resetTouchInput();
	pauseModal.hidden = true;
	gameSettingsButton.hidden = true;
	gamePauseButton.hidden = true;
	gemHud.hidden = true;
	updateTouchControlsVisibility();
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
	resetTouchInput();
	updateSettingsPanels();
	updateKeybindButtons();
	settingsModal.hidden = false;
	languageSelect.focus();
}

function closeSettings() {
	pressedKeys.clear();
	cancelKeybindListening();
	settingsModal.hidden = true;
}

function updateSettingsPanels() {
	const showKeybinds = finePointerMediaQuery.matches || !touchEnabled;

	keybindSettings.hidden = !showKeybinds;
	controlLayoutSettings.hidden = showKeybinds;

	if (!showKeybinds) {
		cancelKeybindListening();
	}
}

function startKeybindListening(action) {
	if (!settings.keybinds[action]) {
		return;
	}

	keybindListeningAction = action;
	updateKeybindButtons();
}

function cancelKeybindListening() {
	if (!keybindListeningAction) {
		return;
	}

	keybindListeningAction = null;
	updateKeybindButtons();
}

function handleKeybindInput(event) {
	if (!keybindListeningAction || event.repeat || hasCommandModifier(event)) {
		return;
	}

	event.preventDefault();

	const action = keybindListeningAction;
	const key = formatKey(event);
	const previousKey = settings.keybinds[action];
	const actionsToUpdate = isViewSwitchAction(action) ? ["switchTopView", "switchSideView"] : [action];

	Object.keys(settings.keybinds).forEach((otherAction) => {
		if (!actionsToUpdate.includes(otherAction) && settings.keybinds[otherAction] === key) {
			settings.keybinds[otherAction] = previousKey;
		}
	});

	actionsToUpdate.forEach((targetAction) => {
		settings.keybinds[targetAction] = key;
	});
	keybindListeningAction = null;
	saveSettings();
	updateKeybindButtons();
}

function updateKeybindButtons() {
	keybindButtons.forEach((button) => {
		const action = button.dataset.keybind;
		const isListening = keybindListeningAction === action;

		button.textContent = isListening
			? translations[settings.language].pressKey
			: formatKeyLabel(settings.keybinds[action]);
		button.classList.toggle("is-listening", isListening);
		button.setAttribute("aria-pressed", String(isListening));
	});
}

function formatKeyLabel(key) {
	const labels = {
		zh: {
			Space: "空格",
			ArrowUp: "↑",
			ArrowDown: "↓",
			ArrowLeft: "←",
			ArrowRight: "→",
		},
		en: {
			Space: "Space",
			ArrowUp: "↑",
			ArrowDown: "↓",
			ArrowLeft: "←",
			ArrowRight: "→",
		},
	};

	return labels[settings.language][key] || key;
}

function isViewSwitchAction(action) {
	return action === "switchTopView" || action === "switchSideView";
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
		gems: activeMap.gems || fallbackMap.gems,
		checkpoints: activeMap.checkpoints || fallbackMap.checkpoints,
	});

	return `map-${hashString(mapSignature)}`;
}

function getActiveSaveName() {
	return activeMap.name || activeMap.title || "3D Block";
}

function renderSavedGameList(savedGames = getSavedGames()) {
	savedGameList.replaceChildren();

	savedGames.forEach((save) => {
		const row = document.createElement("div");
		const button = document.createElement("button");
		const deleteButton = document.createElement("button");
		const title = document.createElement("span");
		const meta = document.createElement("span");

		row.className = "saved-game-row";

		button.type = "button";
		button.className = "saved-game-button";
		button.addEventListener("click", () => startSavedGame(save.id));

		deleteButton.type = "button";
		deleteButton.className = "delete-save-button";
		deleteButton.textContent = "🗑";
		deleteButton.setAttribute("aria-label", translations[settings.language].deleteSave);
		deleteButton.title = translations[settings.language].deleteSave;
		deleteButton.addEventListener("click", () => deleteSavedGame(save.id));

		title.className = "saved-game-title";
		title.textContent = save.mapName || "3D Block";

		meta.className = "saved-game-meta";
		meta.textContent = `${translations[settings.language].savedAt} ${formatSaveTime(save.savedAt)} · ${
			translations[settings.language].progressLabel
		} ${formatProgress(save)}`;

		button.append(title, meta);
		row.append(button, deleteButton);
		savedGameList.append(row);
	});
}

function deleteSavedGame(saveId) {
	const store = getSaveStore();

	delete store.saves[saveId];
	writeSaveStore(store);
	renderSavedGameList();

	if (getSavedGames().length === 0) {
		savePicker.hidden = true;
	}
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
		gems: {
			inventory: { ...gemInventory },
			collectedIds: [...collectedGemIds],
		},
		checkpoints: {
			activatedIds: [...activatedCheckpointIds],
		},
		checkpoint: lastCheckpoint,
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
		resetGemState();
		resetCheckpointState();
		resetPlayer();
		return;
	}

	viewMode = save.viewMode === viewModes.TOP ? viewModes.TOP : viewModes.SIDE;
	gemInventory = {
		[gemTypes.SIDE_TO_TOP]: Math.max(0, Number(save.gems?.inventory?.[gemTypes.SIDE_TO_TOP]) || 0),
		[gemTypes.TOP_TO_SIDE]: Math.max(0, Number(save.gems?.inventory?.[gemTypes.TOP_TO_SIDE]) || 0),
	};
	collectedGemIds = new Set(Array.isArray(save.gems?.collectedIds) ? save.gems.collectedIds : []);
	const savedCheckpoint = normalizeSavedCheckpoint(save.checkpoint);

	activatedCheckpointIds = normalizeActivatedCheckpointIds(save.checkpoints?.activatedIds, savedCheckpoint);
	lastCheckpoint = getFurthestProgressCheckpoint(savedCheckpoint, activatedCheckpointIds, viewMode);
	player.mesh.position.set(position.x, position.y, position.z ?? 0);
	player.velocity.set(velocity.x || 0, velocity.y || 0, velocity.z || 0);
	player.grounded = Boolean(save.player?.grounded);
	player.jumpBufferTimer = 0;
	player.coyoteTimer = 0;
	refreshGemVisibility();
	refreshCheckpointStates();
	updateGemHud();
	updateViewPresentation();
	centerCameraOnPlayer();
}

function normalizeActivatedCheckpointIds(ids, checkpoint) {
	const activatedIds = new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : []);

	if (checkpoint?.id && checkpoint.id !== "spawn") {
		activatedIds.add(checkpoint.id);
	}

	return activatedIds;
}

function normalizeSavedCheckpoint(checkpoint) {
	if (!checkpoint || !Number.isFinite(checkpoint.x) || !Number.isFinite(checkpoint.y)) {
		const spawn = activeMap.spawn || fallbackMap.spawn;

		return {
			id: "spawn",
			progressIndex: -1,
			x: spawn.x,
			y: spawn.y,
			z: 0,
			viewMode: viewModes.SIDE,
		};
	}

	return {
		id: checkpoint.id || "checkpoint",
		progressIndex: Number.isFinite(checkpoint.progressIndex)
			? checkpoint.progressIndex
			: getCheckpointProgressIndex(checkpoint.id),
		x: checkpoint.x,
		y: checkpoint.y,
		z: checkpoint.z ?? 0,
		viewMode: checkpoint.viewMode === viewModes.TOP ? viewModes.TOP : viewModes.SIDE,
	};
}

function getCheckpointProgressIndex(checkpointId) {
	if (!checkpointId || checkpointId === "spawn") {
		return -1;
	}

	return levelCheckpoints.find((checkpoint) => checkpoint.id === checkpointId)?.progressIndex ?? -1;
}

function getFurthestProgressCheckpoint(savedCheckpoint, activatedIds, fallbackViewMode) {
	const furthestCheckpoint = levelCheckpoints
		.filter((checkpoint) => activatedIds.has(checkpoint.id))
		.reduce(
			(furthest, checkpoint) =>
				!furthest || checkpoint.progressIndex > furthest.progressIndex ? checkpoint : furthest,
			null,
		);

	if (!furthestCheckpoint || furthestCheckpoint.progressIndex <= savedCheckpoint.progressIndex) {
		return savedCheckpoint;
	}

	return {
		id: furthestCheckpoint.id,
		progressIndex: furthestCheckpoint.progressIndex,
		x: furthestCheckpoint.x,
		y: furthestCheckpoint.y,
		z: 0,
		viewMode: fallbackViewMode,
	};
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

	sideToTopGemButton.setAttribute(
		"aria-label",
		settings.language === "zh" ? "切换到俯视视角" : "Switch to top view",
	);
	topToSideGemButton.setAttribute(
		"aria-label",
		settings.language === "zh" ? "切换到侧视视角" : "Switch to side view",
	);
	joystickBase.setAttribute("aria-label", settings.language === "zh" ? "移动摇杆" : "Movement joystick");
	jumpButton.setAttribute("aria-label", settings.language === "zh" ? "跳跃" : "Jump");
	closeSupportButton.setAttribute("aria-label", settings.language === "zh" ? "关闭" : "Close");
	updateSettingsPanels();
	updateKeybindButtons();
	updateSupportPayment();
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
	syncViewSwitchKey();

	settings.controlLayout = {
		joystick: normalizeControlPosition(savedSettings.controlLayout?.joystick, defaultControlLayout.joystick),
		jump: normalizeControlPosition(savedSettings.controlLayout?.jump, defaultControlLayout.jump),
		gems: normalizeControlPosition(savedSettings.controlLayout?.gems, defaultControlLayout.gems),
	};
}

function saveSettings() {
	localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}

function syncViewSwitchKey() {
	const switchKey = settings.keybinds.switchTopView || "Q";

	settings.keybinds.switchTopView = switchKey;
	settings.keybinds.switchSideView = switchKey;
}

function normalizeControlPosition(position, fallback) {
	return {
		x: Number.isFinite(position?.x) ? clamp(position.x, 0.05, 0.95) : fallback.x,
		y: Number.isFinite(position?.y) ? clamp(position.y, 0.05, 0.95) : fallback.y,
	};
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

function hasCommandModifier(event) {
	return event.ctrlKey || event.metaKey || event.altKey;
}

// ===== 渲染尺寸与主循环 =====
function resizeRenderer() {
	const width = window.innerWidth;
	const height = getGameViewportHeight();
	const aspect = width / height;
	let halfHeight = cameraHeight / 2;
	let halfWidth = halfHeight * aspect;

	if (width <= 600 && halfWidth < 4.5) {
		halfWidth = 4.5;
		halfHeight = halfWidth / aspect;
	}

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

	if (gameStarted && !gamePaused && !layoutEditing && settingsModal.hidden) {
		updateGame(deltaTime);
		maybeAutoSaveProgress(time);
	}
	updateViewHelpers();
	renderer.render(scene, camera);
}
