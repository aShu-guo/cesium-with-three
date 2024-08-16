import {createColoredCube} from "./cube";
import Stats from 'stats.js'
import airlines from './airlines.json'
import {Cartesian3, createOsmBuildingsAsync, createWorldTerrainAsync, Ion, Math, Viewer} from "cesium";
import {
    AmbientLight,
    AxesHelper,
    Box3,
    Box3Helper,
    CatmullRomCurve3,
    DirectionalLight,
    Mesh,
    MeshLambertMaterial,
    PerspectiveCamera,
    Scene,
    TubeGeometry,
    Vector3,
    WebGLRenderer
} from "three";

interface AirlinePoint {
    latitude: number,
    longitude: number,
    height: number
}

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwM2E2NmM4MC05NjdjLTQ2OTMtYWE2My1hODgwNjY3ZTExZTgiLCJpZCI6MzEzMTMsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyIsInByIl0sImlhdCI6MTU5NTIzNzM1Mn0.K4-n5E9TZOEPpkGLwfIQibplnnU88PfrahgHrrrqRDk'

const location = {
    lon: 119.99546607,
    lat: 30.29172919,
    height: 100
};
const position = Cartesian3.fromDegrees(location.lon, location.lat, location.height);

// CesiumJS
const cesiumViewer = new Viewer("cesium", {
    terrainProvider: await createWorldTerrainAsync(),
    // useDefaultRenderLoop: false,
    skyBox: false,
    baseLayerPicker: false,
    geocoder: false,
    sceneModePicker: false,
    animation: false,
    timeline: false,
    navigationHelpButton: false,
});
cesiumViewer.scene.debugShowFramesPerSecond = true;
const osmBuildings = await createOsmBuildingsAsync();
cesiumViewer.scene.primitives.add(osmBuildings);


// three.js
const threeContainer = document.getElementById("three");
const threeScene = new Scene();
const threeCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 50000000);
const threeRenderer = new WebGLRenderer({alpha: true});
threeRenderer.setSize(window.innerWidth, window.innerHeight);
threeContainer?.appendChild(threeRenderer.domElement);

// 添加环境光照和平行光
var aLight = new AmbientLight(0xffffff, 0.3);
var dLight = new DirectionalLight(0xffffff, 1);
dLight.position.set(1000, -100, 900);
threeScene.add(dLight);
threeScene.add(aLight);
// 添加坐标轴helper
const axesHelper = new AxesHelper(50000000);
threeScene.add(axesHelper);

// 在threejs中创建一个cube，并添加到scene中
const cube = createColoredCube();
cube.position.set(position.x, position.y, position.z);
threeScene.add(cube)

// 添加包围盒
const box = new Box3();
box.setFromCenterAndSize(new Vector3(position.x, position.y, position.z), new Vector3(1000, 1000, 1000));
const helper = new Box3Helper(box, 0xffff00);
threeScene.add(helper);

// 添加管道
const material = new MeshLambertMaterial({color: 0x00ffff, wireframe: true})
const curve = new CatmullRomCurve3((airlines as AirlinePoint[]).map(point => {
    const degrees = Cartesian3.fromDegrees(point.longitude, point.latitude, point.height)
    return new Vector3(degrees.x, degrees.y, degrees.z)
}))
const geometry = new TubeGeometry(curve, 20, 20, 30, false)
const mesh = new Mesh(geometry, material)
threeScene.add(mesh)

// cesium
cesiumViewer.camera.flyTo({
    destination: position,
})

function updateThreeJS() {
    // Update js camera field of view to match Cesium camera's vertical FOV
    threeCamera.fov = Math.toDegrees(cesiumViewer.camera.frustum.fovy);
    threeCamera.updateProjectionMatrix();

    // 同步three与cesium的相机
    const cesiumCamera = cesiumViewer.camera;
    const cvm = cesiumCamera.viewMatrix;
    const civm = cesiumCamera.inverseViewMatrix;

    const cameraPosition = Cartesian3.fromElements(civm[12], civm[13], civm[14]);
    const cameraDirection = new Cartesian3(-cvm[2], -cvm[6], -cvm[10]);
    const cameraUp = new Cartesian3(cvm[1], cvm[5], cvm[9]);

    const cameraPositionVec3 = new Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    const cameraDirectionVec3 = new Vector3(cameraDirection.x, cameraDirection.y, cameraDirection.z);
    const cameraUpVec3 = new Vector3(cameraUp.x, cameraUp.y, cameraUp.z);

    threeCamera.position.copy(cameraPositionVec3);
    threeCamera.up.copy(cameraUpVec3);
    threeCamera.lookAt(cameraPositionVec3.clone().add(cameraDirectionVec3));

    cube.rotation.x += 0.01;
    threeRenderer.render(threeScene, threeCamera);
};

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    threeRenderer.setSize(width, height);
    threeCamera.aspect = width / height;
    threeCamera.updateProjectionMatrix();
});

function renderLoop() {
    stats.begin();

    requestAnimationFrame(renderLoop);
    cesiumViewer.render();
    updateThreeJS();

    stats.end();

}

renderLoop();
