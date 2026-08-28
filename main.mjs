import * as THREE from "three"

// for qr code generation
const qr_elem = document.getElementById("qr-code");
let qrcode = new QRCode(qr_elem, "qrcode");

const generate_qr_btn = document.getElementById("generate-qr-button");
let generateQR = () => {
    const qrInput = document.getElementById("qr-input");
    qrcode.clear();
    qrcode.makeCode(qrInput.value);
};
generate_qr_btn.onclick = generateQR;

// for tree generation