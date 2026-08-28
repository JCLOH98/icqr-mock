import * as THREE from "three"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// init canvas items
const scene = new THREE.Scene();
const canvas = document.getElementById("qr-tree");
const aspect = canvas.clientWidth / canvas.clientHeight;
const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
function resizeRendererToDisplaySize(renderer) {
    // ref: https://threejs.org/manual/#en/responsive
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = Math.floor(canvas.clientWidth * pixelRatio);
    const height = Math.floor(canvas.clientHeight * pixelRatio);
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

// init qr items
const qr_elem = document.getElementById("qr-code");
let qrcode = new QRCode(qr_elem, "qrcode");
let pixel_list = [];
let pixel_size_1d = 0;


// for qr code generation
let getQrCodeMatrix = () => {
    const qrEngine = qrcode._oQRCode;
    const size = qrEngine.getModuleCount();
    console.log(`QR Grid detected: ${size} x ${size} units`);

    pixel_list = [];

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            // .isDark(row, col) returns true for black modules and false for white modules
            const isBlack = qrEngine.isDark(row, col);

            pixel_list.push(isBlack ? 1 : 0);
        }
    }
    console.log("QR Code Matrix:", pixel_list);
    pixel_size_1d = size;
}

// TOFIX: generate 3d for now
let generateVisual = () => {
    scene.clear();
    const final_cube = new THREE.Object3D()
    for (let i = 0; i < pixel_size_1d; i++) {
        for (let j = 0; j < pixel_size_1d; j++) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

            if (pixel_list[i * pixel_size_1d + j] == 0) {
                continue
            }

            const material = new THREE.MeshPhongMaterial({ emissive: randomColor });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.x = i;
            cube.position.y = j;
            final_cube.add(cube);
        }
    }
    scene.add(final_cube);
    final_cube.rotation.z = -Math.PI / 2;
    final_cube.position.x = -pixel_size_1d / 2;
    final_cube.position.y = pixel_size_1d / 2;
}
getQrCodeMatrix();
generateVisual();

const generate_qr_btn = document.getElementById("generate-qr-button");



let generateQR = () => {
    const qrInput = document.getElementById("qr-input");
    qrcode.clear();
    qrcode.makeCode(qrInput.value);
    getQrCodeMatrix();

    // update the render as well
    generateVisual();
};
generate_qr_btn.onclick = generateQR;

// for tree visualization
camera.position.z = pixel_size_1d * 2;

const light_color = 0xffffff;
const light_intensity = 1;
const dir_light = new THREE.DirectionalLight(light_color, light_intensity);
dir_light.position.set(camera.position.x, camera.position.y, camera.position.z);
scene.add(dir_light);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();
function animate() {
    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();
    dir_light.position.set(camera.position.x, camera.position.y, camera.position.z);
    if (resizeRendererToDisplaySize(renderer)) {
        camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
        camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
