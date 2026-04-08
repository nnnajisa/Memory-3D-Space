import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

// DOM refs
const startOverlay = document.getElementById("startOverlay");
const enterButton = document.getElementById("enterButton");
const videoEl = document.getElementById("myVideo");

// scene
const scene = new THREE.Scene();

// HDRI
const exrLoader = new EXRLoader();
exrLoader.load(
  "bg.exr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
    console.log("EXR loaded");
  },
  undefined,
  (err) => {
    console.error("bg.exr failed to load", err);
  }
);

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement);

// camera
const cam = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
cam.position.set(0, 7, 22);
cam.lookAt(0, 2, 0);

// controls
const controls = new OrbitControls(cam, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);
controls.minDistance = 6;
controls.maxDistance = 40;
controls.maxPolarAngle = Math.PI * 0.49;

// overlay enter
let hasEntered = false;

async function enterScene(e) {
  if (e) e.stopPropagation();
  if (hasEntered) return;
  hasEntered = true;

  startOverlay.style.display = "none";

  try {
    await videoEl.play();
  } catch (err) {
    console.warn("video play blocked", err);
  }
}

enterButton.addEventListener("click", enterScene);
startOverlay.addEventListener("click", enterScene);

// lights
const ambLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
dirLight.position.set(7, 12, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -30;
dirLight.shadow.camera.right = 30;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 80;
scene.add(dirLight);

// ocean video texture
const videoTex = new THREE.VideoTexture(videoEl);
videoTex.colorSpace = THREE.SRGBColorSpace;
videoTex.wrapS = THREE.RepeatWrapping;
videoTex.wrapT = THREE.RepeatWrapping;
videoTex.repeat.set(3, 3);

// ocean
const seaY = -0.35;

const oceanGeo = new THREE.PlaneGeometry(160, 160);
const oceanMat = new THREE.MeshStandardMaterial({
  map: videoTex,
  color: 0x223344,
  roughness: 0.25,
  metalness: 0.3,
  envMapIntensity: 1.1,
});
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = seaY;
ocean.receiveShadow = true;
scene.add(ocean);

// island
const islandGeo = new THREE.CylinderGeometry(12, 16, 4, 48);
const islandMat = new THREE.MeshStandardMaterial({
  color: 0xc8c3bc,
  roughness: 0.95,
  metalness: 0.02,
});
const island = new THREE.Mesh(islandGeo, islandMat);
island.position.y = -1.5;
island.receiveShadow = true;
island.castShadow = true;
scene.add(island);

// shell
const shellRadius = 5.7;
const shellClipPlane = new THREE.Plane(
  new THREE.Vector3(0, 0, -1),
  1.15
);

const shellGeo = new THREE.SphereGeometry(shellRadius, 72, 56);
const shellMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1.0,
  metalness: 0.0,
  side: THREE.DoubleSide,
  clippingPlanes: [shellClipPlane],
  clipShadows: true,
});
const shell = new THREE.Mesh(shellGeo, shellMat);
shell.position.set(0, 0.5, -0.8);
scene.add(shell);

// floor
const floorGeo = new THREE.CircleGeometry(5, 64);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.95,
  metalness: 0.0,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0.52;
floor.receiveShadow = true;
scene.add(floor);

// artwork spotlight
const artSpot = new THREE.SpotLight(0xfff4dd, 45, 20, Math.PI / 7, 0.45, 1.2);
artSpot.position.set(0, 5.2, -2.0);
artSpot.castShadow = true;
artSpot.shadow.mapSize.set(1024, 1024);
scene.add(artSpot);

const artTarget = new THREE.Object3D();
artTarget.position.set(0, 2.1, -4.1);
scene.add(artTarget);
artSpot.target = artTarget;

// artwork frame
const texLoader = new THREE.TextureLoader();
const artTex = texLoader.load("pic.JPG");
artTex.colorSpace = THREE.SRGBColorSpace;

const frameGroup = new THREE.Group();

const frameW = 1.35;
const frameH = 1.9;

const frameBorderGeo = new THREE.BoxGeometry(frameW + 0.14, frameH + 0.14, 0.08);
const frameBorderMat = new THREE.MeshStandardMaterial({
  color: 0x1d1d20,
  roughness: 0.6,
  metalness: 0.15,
});
const frameBorder = new THREE.Mesh(frameBorderGeo, frameBorderMat);
frameBorder.castShadow = true;
frameBorder.receiveShadow = true;
frameGroup.add(frameBorder);

const artGeo = new THREE.PlaneGeometry(frameW, frameH);
const artMat = new THREE.MeshStandardMaterial({
  map: artTex,
  roughness: 0.9,
  metalness: 0.0,
});
const artMesh = new THREE.Mesh(artGeo, artMat);
artMesh.position.z = 0.05;
artMesh.receiveShadow = true;
frameGroup.add(artMesh);

frameGroup.position.set(0, 2.1, -4.15);
frameGroup.rotation.y = 0;
scene.add(frameGroup);

// loaders
const gltfLoader = new GLTFLoader();

// lips
gltfLoader.load(
  "models/lip.glb",
  (gltf) => {
    const lip = gltf.scene;

    lip.scale.set(9, 9, 5);
    lip.position.set(0, 0.7, -1.7);
    lip.rotation.y = 0;
    lip.rotation.z = 0;
    lip.rotation.x = -0.3;

    lip.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0x8b1018,
          roughness: 0.4,
          metalness: 0.08,
          envMapIntensity: 1.0,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(lip);
    console.log("lip loaded");
  },
  undefined,
  (err) => {
    console.error("models/lip.glb failed to load", err);
  }
);

// teeth
const toothTemplates = [];
const floatingTeeth = [];

gltfLoader.load(
  "models/tooth.glb",
  (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        const mesh = child.clone();

        mesh.geometry = child.geometry.clone();
        mesh.geometry.computeBoundingBox();
        mesh.geometry.center();

        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);

        mesh.material = new THREE.MeshStandardMaterial({
          color: 0xf3efe8,
          roughness: 0.95,
          metalness: 0.02,
          envMapIntensity: 1.0,
        });

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        toothTemplates.push(mesh);
      }
    });

    console.log("teeth loaded:", toothTemplates.length);

    if (toothTemplates.length === 0) return;

    const count = 480;
    const baseRadius = 20;

    for (let i = 0; i < count; i++) {
      const source =
        toothTemplates[Math.floor(Math.random() * toothTemplates.length)];
      const tooth = source.clone();

      const angle = (i / count) * Math.PI * 2;
      const radius = baseRadius + (Math.random() - 0.5) * 0.24;

      tooth.position.set(
        Math.cos(angle) * radius,
        seaY + 0.06 + Math.random() * 0.03,
        Math.sin(angle) * radius
      );

      tooth.rotation.set(
        (Math.random() - 0.5) * 0.3,
        angle + Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.25
      );

      const s = 0.24 + Math.random() * 0.08;
      tooth.scale.setScalar(s);

      if (Math.random() < 0.06) {
        tooth.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.08,
          metalness: 0.95,
          envMapIntensity: 1.6,
        });
      }

      scene.add(tooth);

      if (Math.random() < 0.22) {
        floatingTeeth.push({
          mesh: tooth,
          baseY: tooth.position.y,
          phase: Math.random() * Math.PI * 2,
          amp: 0.015 + Math.random() * 0.02,
          speed: 0.8 + Math.random() * 0.7,
        });
      }
    }
  },
  undefined,
  (err) => {
    console.error("models/tooth.glb failed to load", err);
  }
);

// movement controls
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  ArrowUp: false,
  ArrowDown: false,
};

window.addEventListener("keydown", (e) => {
  if (e.key in keys) keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key in keys) keys[e.key] = false;
});

const clock = new THREE.Clock();

function updateMovement(delta) {
  const moveSpeed = 6 * delta;
  const verticalSpeed = 4 * delta;

  const forward = new THREE.Vector3();
  cam.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  const move = new THREE.Vector3();

  if (keys.w) move.add(forward);
  if (keys.s) move.sub(forward);
  if (keys.a) move.sub(right);
  if (keys.d) move.add(right);

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(moveSpeed);
    cam.position.add(move);
    controls.target.add(move);
  }

  if (keys.ArrowUp) {
    cam.position.y += verticalSpeed;
    controls.target.y += verticalSpeed;
  }
  if (keys.ArrowDown) {
    cam.position.y -= verticalSpeed;
    controls.target.y -= verticalSpeed;
  }
}

// loop
function drawLoop() {
  const delta = clock.getDelta();
  const t = clock.elapsedTime;

  updateMovement(delta);

  floatingTeeth.forEach((item) => {
    item.mesh.position.y =
      item.baseY + Math.sin(t * item.speed + item.phase) * item.amp;
  });

  controls.update();
  renderer.render(scene, cam);
  window.requestAnimationFrame(drawLoop);
}
drawLoop();

// resize
window.addEventListener("resize", () => {
  cam.aspect = window.innerWidth / window.innerHeight;
  cam.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});