import * as THREE from "three";
import { WebGLRenderer } from "three";
import AppStore from "store/AppStore";
import React from "react";
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
// import {ImprovedNoise} from "three/examples/jsm/math/ImprovedNoise";
// import * as TWEEN from '@tweenjs/tween.js'
import fragmentShader from "./fragmentShader.glsl";
// @ts-ignore
import vertexShader from "./vertexShader.glsl";
import SkyConstructor from "modules/water/SkyConstructor";
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';

export default class SceneConstructor {
    frame;
    active = true;
    scene = new THREE.Scene();
    camDef = new THREE.Vector3(0, 30, -500);
    camera;
    renderer: WebGLRenderer = new WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
        // precision: "lowp",
        // depth: false,
    });
    onDemand = false;
    renderFns: Set<Function> = new Set();
    controls: OrbitControls;
    waterGeometry: THREE.PlaneGeometry;
    waterMesh: THREE.Mesh | null = null;


    constructor(frame: HTMLDivElement) {
        this.frame = frame;
        this.camera = new THREE.PerspectiveCamera(
            40,
            this.frame.clientWidth / this.frame.clientHeight,
            0.1,
            6000
        );
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.waterGeometry = new THREE.PlaneGeometry(128 * 8, 128 * 8, 300, 300);
        this.waterGeometry.rotateX(-Math.PI / 2);

        this.init();
        this.initBase();
    }

    init = () => {
        const { x, y, z } = this.camDef;
        this.camera.position.set(x, y, z);
        this.camera.rotation.x = 0;
        //target
        this.controls.target.set(0, -1.5, 0);
        //zoom
        this.controls.minDistance = 3;

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.VSMShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setSize(this.frame.clientWidth, this.frame.clientHeight);
        this.frame.appendChild(this.renderer.domElement);

        window.addEventListener("resize", this.onWindowResize);
        if (typeof requestAnimationFrame != "undefined") {
            requestAnimationFrame(this.onRAF);
        }

        AppStore.events.on("addSubRender", this.addSubRender);
        AppStore.events.on("removeSubRender", this.removeSubRender);
    };

    sphericalToCartesian(azimuth: number, elevation: number) {
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);
        const sun = new THREE.Vector3();
        return sun.setFromSphericalCoords(1, phi, theta);
    }

    waterMaterial = (sunPosition: THREE.Vector3, cameraPosition: THREE.Vector3, cameraTarget: THREE.Vector3) => {
        const waterShader = {
            uniforms: {
                time: { value: 0.0 },
                resolution: { value: new THREE.Vector2() },
                uvRate1: { value: new THREE.Vector2(1, 1) },
                sunPosition: { value: sunPosition }, // Pass sun position as a uniform
                cameraPos: { value: cameraPosition }, // Pass camera position as a uniform
                cameraTarget: { value: cameraTarget }, // Pass camera target as a uniform
                reflectionTexture: { value: null }, // Reflection texture
                refractionTexture: { value: null } // Refraction texture
            },
            vertexShader,
            fragmentShader
        };

        const water = new THREE.ShaderMaterial({
            uniforms: waterShader.uniforms,
            vertexShader: waterShader.vertexShader,
            fragmentShader: waterShader.fragmentShader,
        });

        return water;
    }

    initBase = async () => {
        const scene = this.scene;
        this.scene.add(new THREE.AmbientLight(0x9e9b91, 10));

        // const xyzHelper = new THREE.AxesHelper(100); //The X axis is red. The Y axis is green. The Z axis is blue.
        // scene.add(xyzHelper);

        const skyController = {
            turbidity: 0,
            rayleigh: 0.15,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 7,
            azimuth: 0,
            exposure: this.renderer.toneMappingExposure
        };

        const skyConstructor = new SkyConstructor(this.renderer, skyController);
        const sky = skyConstructor.sky;
        this.scene.add(sky);

        const sunPosition = this.sphericalToCartesian(skyController.azimuth, skyController.elevation);
        sunPosition.multiplyScalar(2000);
        //sun mesh
        const sunMesh = new THREE.Mesh(
            new THREE.SphereGeometry(25, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        sunMesh.position.copy(sunPosition);
        scene.add(sunMesh);
        sunMesh.visible = false;


        const water = this.waterMesh = new THREE.Mesh(
            this.waterGeometry,
            this.waterMaterial(sunPosition, this.camera.position, this.controls.target)
        );
        scene.add(water);

        const reflectionTexture = new THREE.WebGLRenderTarget(128 * 8, 128 * 8);
        const refractionTexture = new THREE.WebGLRenderTarget(128 * 8, 128 * 8);
        (water.material as THREE.ShaderMaterial).uniforms.reflectionTexture.value = reflectionTexture.texture;
        (water.material as THREE.ShaderMaterial).uniforms.refractionTexture.value = refractionTexture.texture;

        // const reflectionHelper = new THREE.Mesh(
        //     new THREE.PlaneGeometry(128, 80),
        //     new THREE.MeshBasicMaterial({ map: reflectionTexture.texture, side: THREE.DoubleSide})
        // );
        // reflectionHelper.position.y = 40;
        // reflectionHelper.position.x = 0;
        // reflectionHelper.position.z = 0;
        // scene.add(reflectionHelper);

        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0x00ff00 })
        );
        mesh.position.y = 40;
        mesh.castShadow = true;
        scene.add(mesh);
        const meshes = [mesh];
        for (let i = 0; i < 10; i++) {
            const clone = mesh.clone();
            clone.position.x = Math.random() * 500 - 250;
            // clone.position.y = Math.random() * 100 - 50;
            clone.position.z = Math.random() * 500 - 250;
            scene.add(clone);
            meshes.push(clone);
        }

        const calcTextures = (timestamp: number) => {
            const time = timestamp * 0.001;
            // reflectionHelper.visible = false;
            water.visible = false;
            this.renderer.setRenderTarget(reflectionTexture);
            this.renderer.render(scene, this.camera);
            this.renderer.setRenderTarget(null);

            this.renderer.setRenderTarget(refractionTexture);
            this.renderer.render(scene, this.camera);
            this.renderer.setRenderTarget(null);
            // reflectionHelper.visible = true;
            water.visible = true;

            (water.material as THREE.ShaderMaterial).uniforms.time.value = time;
            (water.material as THREE.ShaderMaterial).uniforms.cameraPos.value = this.camera.position;
            (water.material as THREE.ShaderMaterial).uniforms.cameraPos.value = this.camera.position;
            (water.material as THREE.ShaderMaterial).uniforms.cameraTarget.value = this.controls.target;

            meshes.forEach(mesh => {
                mesh.rotation.y = time;
                mesh.translateY(Math.sin(time) * 0.1);
            });

        }

        calcTextures(0);
        this.addSubRender(calcTextures);

        this.render(0);
        AppStore.events.emit("ViewLoadingDone");
    };

    onWindowResize = () => {
        this.camera.aspect = this.frame.clientWidth / this.frame.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.frame.clientWidth, this.frame.clientHeight);

        if (this.onDemand) this.render(0);
    };

    render = (timestamp: number) => {
        this.renderer.render(this.scene, this.camera);
        // TWEEN.update();

        this.controls.update();
    };

    onRAF = (timestamp: number) => {
        if (!this.active) return;
        this.renderFns.forEach(fn => fn(timestamp));
        this.render(timestamp);

        requestAnimationFrame(this.onRAF);
    };

    addSubRender = (fn: Function) => {
        this.renderFns.add(fn);
    };

    removeSubRender = (fn: Function) => {
        this.renderFns.delete(fn);
    };

    destroy = () => {
        this.active = false;
        const { frame } = this;
        AppStore.events.off("addSubRender", this.addSubRender);
        AppStore.events.off("removeSubRender", this.removeSubRender);

        window.removeEventListener("resize", this.onWindowResize);
    };
}
