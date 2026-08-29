import * as THREE from "three"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// init canvas items
const scene = new THREE.Scene();
const canvas = document.getElementById("qr-tree");
const aspect = canvas.clientWidth / canvas.clientHeight;
// const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
const zoomNum = 50;
const camera = new THREE.OrthographicCamera(-zoomNum * aspect / 2, zoomNum * aspect / 2, zoomNum / 2, -zoomNum / 2, 0.1, 1000);
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
const light_color = "#999999";
const light_intensity = 1;
const dir_light = new THREE.DirectionalLight(light_color, light_intensity);

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
        let row_list = [];
        for (let col = 0; col < size; col++) {
            // .isDark(row, col) returns true for black modules and false for white modules

            const isBlack = qrEngine.isDark(row, col);

            row_list.push(isBlack ? 1 : 0);
        }
        pixel_list.push(row_list);
    }
    console.log("QR Code Matrix:", pixel_list);
    pixel_size_1d = size;
}

let generateLight = () => {
    dir_light.position.set(camera.position.x, camera.position.y, camera.position.z);
    scene.add(dir_light);
}

// TOFIX: generate 3d for now
let finder_size = 7;
let fence_height = 3;
const FENCE_COLOR = "#888888";
let trunk_height = 4;
const TRUNK_COLOR = "#8B4513";
let leaves_height = 3;
const LEAVES_COLOR = "#00ff00";
const WATER_COLOR = "#112d54";
let generateFinderTree = () => {
    let tree_obj = new THREE.Object3D()
    for (let row = 0; row < finder_size; row++) {
        for (let col = 0; col < finder_size; col++) {

            // empty space as water
            if (pixel_list[row][col] == 0) {
                let color = WATER_COLOR;

                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshPhongMaterial({ emissive: color });
                const water_cube = new THREE.Mesh(geometry, material);
                water_cube.position.x = row;
                water_cube.position.y = col;
                water_cube.position.z = 0;
                tree_obj.add(water_cube);
            }

            let is_fence = (row == 0 || col == 0 || row == finder_size - 1 || col == finder_size - 1);
            let is_trunk = row == Math.floor(finder_size / 2) && col == Math.floor(finder_size / 2);

            for (let z = 0; z < finder_size; z++) {
                if (z == 0) {
                    if (!is_fence) {
                        // defined as water
                        let color = WATER_COLOR;

                        const geometry = new THREE.BoxGeometry(1, 1, 1);
                        const material = new THREE.MeshPhongMaterial({ emissive: color });
                        const water_cube = new THREE.Mesh(geometry, material);
                        water_cube.position.x = row;
                        water_cube.position.y = col;
                        water_cube.position.z = 0;
                        tree_obj.add(water_cube);
                    }
                }

                // generate fence
                if (z < fence_height && is_fence) {
                    let color = FENCE_COLOR;

                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = new THREE.MeshPhongMaterial({ emissive: color });
                    const fence_cube = new THREE.Mesh(geometry, material);
                    fence_cube.position.x = row;
                    fence_cube.position.y = col;
                    fence_cube.position.z = z;
                    tree_obj.add(fence_cube);

                }

                // generate trunk
                if (z < trunk_height && is_trunk) {
                    let color = TRUNK_COLOR;

                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = new THREE.MeshPhongMaterial({ emissive: color });
                    const trunk_cube = new THREE.Mesh(geometry, material);
                    trunk_cube.position.x = row;
                    trunk_cube.position.y = col;
                    trunk_cube.position.z = z;
                    tree_obj.add(trunk_cube);
                }

                // generate leaves
                if (z >= trunk_height && z < trunk_height + leaves_height && !is_fence) {
                    if (pixel_list[row][col] == 1) {
                        let color = LEAVES_COLOR;

                        const geometry = new THREE.BoxGeometry(1, 1, 1);
                        const material = new THREE.MeshPhongMaterial({ emissive: color });
                        const leaves_cube = new THREE.Mesh(geometry, material);
                        leaves_cube.position.x = row;
                        leaves_cube.position.y = col;
                        leaves_cube.position.z = z;
                        tree_obj.add(leaves_cube);
                    }
                }
            }
        }
    }
    return tree_obj;
}
let generateVisual = () => {
    scene.clear();

    generateLight();

    const final_cube = new THREE.Object3D()
    let tree_object = generateFinderTree()
    final_cube.add(tree_object)
    for (let row = 0; row < pixel_size_1d; row++) {
        for (let col = 0; col < pixel_size_1d; col++) {

            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const random_color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

            if (pixel_list[row][col] == 0) {
                continue
            }

            let color = random_color;
            if (row < finder_size && col < finder_size || row >= pixel_size_1d - finder_size && col < finder_size || row < finder_size && col >= pixel_size_1d - finder_size) {
                // this is where the finder tree located
                continue;
            }

            const material = new THREE.MeshPhongMaterial({ emissive: color });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.x = row;
            cube.position.y = col;
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
