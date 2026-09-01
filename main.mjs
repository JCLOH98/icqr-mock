import * as THREE from "three"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// init canvas items
const scene = new THREE.Scene();
const canvas = document.getElementById("qr-tree");
const aspect = canvas.clientWidth / canvas.clientHeight;

const persp_camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
const zoomNum = 50;
const ortho_camera = new THREE.OrthographicCamera(-zoomNum * aspect / 2, zoomNum * aspect / 2, zoomNum / 2, -zoomNum / 2, 0.1, 1000);

let camera = ortho_camera;
document.getElementById("persp-cam-button").onclick = () => {
    persp_camera.position.copy(camera.position);
    persp_camera.quaternion.copy(camera.quaternion);
    camera = persp_camera;

    //update the control
    controls.object = camera;
    constrols.update()
}

document.getElementById("ortho-cam-button").onclick = () => {
    ortho_camera.position.copy(camera.position);
    ortho_camera.quaternion.copy(camera.quaternion);
    camera = ortho_camera;

    //update the control
    controls.object = camera;
    constrols.update()
}

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
const dir_light_intensity = 10;
const dir_light = new THREE.DirectionalLight(light_color, dir_light_intensity);

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
    scene.add(dir_light);
}

// generate 3d visuals
let finder_size = 7;
let fence_height = 2;
const FENCE_COLOR = "#888888";
let trunk_height = 4;
const TRUNK_COLOR = "#8B4513";
let leaves_height = 3;
const LEAVES_COLOR = "#00ff00";
const DARK_GREEN = "#006400";
const WATER_COLOR = "#112d54";
const GROUND_COLOR = "#555555";
let generateFinderTree = (start_row_idx, start_col_idx) => {

    let tree_obj = new THREE.Object3D()
    for (let row = start_row_idx; row < start_row_idx + finder_size; row++) {
        for (let col = start_col_idx; col < start_col_idx + finder_size; col++) {

            // empty space as water
            if (pixel_list[row][col] == 0) {
                let color = WATER_COLOR;

                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshPhongMaterial({ color: color });
                const water_cube = new THREE.Mesh(geometry, material);
                water_cube.position.x = row;
                water_cube.position.y = col;
                water_cube.position.z = 0;
                tree_obj.add(water_cube);
            }

            let is_fence = (row == start_row_idx || col == start_col_idx || row == start_row_idx + finder_size - 1 || col == start_col_idx + finder_size - 1);
            let is_trunk = row == start_row_idx + Math.floor(finder_size / 2) && col == start_col_idx + Math.floor(finder_size / 2);

            for (let z = 0; z < finder_size; z++) {
                if (z == 0) {
                    if (!is_fence) {
                        // defined as water
                        let color = WATER_COLOR;

                        const geometry = new THREE.BoxGeometry(1, 1, 1);
                        const material = new THREE.MeshPhongMaterial({ color: color });
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
                    const material = new THREE.MeshPhongMaterial({ color: color });
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
                    const material = new THREE.MeshPhongMaterial({ color: color });
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
                        const material = new THREE.MeshPhongMaterial({ color: color });
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

    // update the camera pos
    const ortho_zoom = pixel_size_1d * 2;
    camera.left = -ortho_zoom * aspect / 2;
    camera.right = ortho_zoom * aspect / 2;
    camera.top = ortho_zoom / 2;
    camera.bottom = -ortho_zoom / 2;
    camera.updateProjectionMatrix();

    const final_cube = new THREE.Object3D();
    let tree_1 = generateFinderTree(0, 0);
    let tree_2 = generateFinderTree(0, pixel_size_1d - finder_size);
    let tree_3 = generateFinderTree(pixel_size_1d - finder_size, 0);
    final_cube.add(tree_1);
    final_cube.add(tree_2);
    final_cube.add(tree_3);

    const main_tree = new THREE.Object3D();
    const main_trunk_height = 10;
    const main_trunk_size = 3;
    const main_leaves_height_max = 10;
    for (let row = 0; row < pixel_size_1d; row++) {
        for (let col = 0; col < pixel_size_1d; col++) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            if (row < finder_size && col < finder_size || row >= pixel_size_1d - finder_size && col < finder_size || row < finder_size && col >= pixel_size_1d - finder_size) {
                // this is where the finder tree located
                continue;
            }

            for (let z = 0; z < pixel_size_1d; z++) {
                let color = LEAVES_COLOR;

                let is_trunk = row < Math.floor(pixel_size_1d / 2 + main_trunk_size / 2) && col < Math.floor(pixel_size_1d / 2 + main_trunk_size / 2) && row >= Math.floor(pixel_size_1d / 2 - main_trunk_size / 2) && col >= Math.floor(pixel_size_1d / 2 - main_trunk_size / 2) && z < main_trunk_height;

                if (is_trunk) {
                    color = TRUNK_COLOR;
                }
                else if (pixel_list[row][col] == 0) {
                    color = DARK_GREEN;
                }
                else if (z == 0) {
                    color = GROUND_COLOR;
                }
                const material = new THREE.MeshPhongMaterial({ color: color });
                const cube = new THREE.Mesh(geometry, material);
                cube.position.x = row;
                cube.position.y = col;

                let max_leaves_z = Math.min(pixel_size_1d - 1, main_trunk_height + main_leaves_height_max);
                if (is_trunk) {
                    cube.position.z = z;
                }
                else if (z == max_leaves_z) {
                    cube.position.z = z;
                    if (pixel_list[row][col] == 0) {
                        continue;
                    }
                }
                else if (z >= main_trunk_height && z < main_trunk_height + main_leaves_height_max) {
                    const show_leaves = Math.floor(Math.random() * 10);
                    if (show_leaves === 1) {
                        cube.position.z = z;
                    }
                    else {
                        continue;
                    }

                }
                else if (z == 0) {
                    cube.position.z = 0;
                }
                else {
                    continue;
                }
                main_tree.add(cube);
            }
        }
    }
    final_cube.add(main_tree);

    // the final object 3d
    scene.add(final_cube);
    final_cube.rotation.z = -Math.PI / 2;
    final_cube.position.x = -pixel_size_1d / 2;
    final_cube.position.y = pixel_size_1d / 2;
}
getQrCodeMatrix();
generateVisual();

const qr_input_button = document.getElementById("qr-input-button");

let generateQR = () => {
    const qrInput = document.getElementById("qr-input");
    qrcode.clear();
    qrcode.makeCode(qrInput.value);
    getQrCodeMatrix();

    // update the render as well
    generateVisual();
};
qr_input_button.onclick = generateQR;

// for tree visualization
camera.position.z = pixel_size_1d;


const controls = new OrbitControls(camera, renderer.domElement);
controls.update();
function animate() {
    dir_light.position.x = camera.position.x;
    dir_light.position.y = camera.position.y;
    dir_light.position.z = camera.position.z;

    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();
    if (resizeRendererToDisplaySize(renderer)) {
        camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
        camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
