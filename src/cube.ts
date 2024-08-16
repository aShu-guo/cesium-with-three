import {BoxGeometry, Mesh, MeshBasicMaterial} from "three";

function createColoredCube() {
    const size = 50;
    const geometry = new BoxGeometry(size, size, size);

    const materials = [
        new MeshBasicMaterial({ color: 0xff0000 }), // 左 - Red
        new MeshBasicMaterial({ color: 0x00ff00 }), // 右 - Green
        new MeshBasicMaterial({ color: 0x0000ff }), // 上 - Blue
        new MeshBasicMaterial({ color: 0xffff00 }), // 下 - Yellow
        new MeshBasicMaterial({ color: 0x00ffff }), // 前 - Cyan
        new MeshBasicMaterial({ color: 0xff00ff })  // 后 - Magenta
    ];

    return new Mesh(geometry, materials);
};
export { createColoredCube };
