import { Sky } from "three/examples/jsm/objects/Sky.js";
import * as THREE from "three";

type skyOptions = {
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
    elevation: number;
    azimuth: number;
    exposure: number;
};

export default class SkyConstructor {
    renderer: THREE.WebGLRenderer;
    options: skyOptions = {
        turbidity: 10,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 2,
        azimuth: 0,
        exposure: 0.5
    };
    sky;

    constructor(renderer: THREE.WebGLRenderer, options: skyOptions) {
        this.renderer = renderer;
        if (options) this.options = options;
        this.options.exposure = this.renderer
            ? this.renderer.toneMappingExposure
            : 0.5;

        this.sky = this.initSky();
    }

    initSky = () => {
        const effectController = this.options;

        const sky = new Sky();
        sky.scale.setScalar(500);

        const sun = new THREE.Vector3();

        const uniforms = sky.material.uniforms;
        uniforms["turbidity"].value = effectController.turbidity;
        uniforms["rayleigh"].value = effectController.rayleigh;
        uniforms["mieCoefficient"].value = effectController.mieCoefficient;
        uniforms["mieDirectionalG"].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
        const theta = THREE.MathUtils.degToRad(effectController.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        uniforms["sunPosition"].value.copy(sun);

        this.renderer.toneMappingExposure = effectController.exposure;

        return sky;
    };
}
