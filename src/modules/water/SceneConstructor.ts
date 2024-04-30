import * as THREE from "three";
import { WebGLRenderer } from "three";
import AppStore from "store/AppStore";
import React from "react";
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
// import {ImprovedNoise} from "three/examples/jsm/math/ImprovedNoise";
// import * as TWEEN from '@tweenjs/tween.js'
import fragmentShader from "./fragmentShader.c";
// @ts-ignore
import vertexShader from "./vertexShader.c";
import SkyConstructor from "modules/water/SkyConstructor";

export default class SceneConstructor {
    frame;
    active = true;
    scene = new THREE.Scene();
    camDef = new THREE.Vector3(0, 15, 300);
    camera;
    renderer: WebGLRenderer = new WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance"
        // precision: "lowp",
        // depth: false,
    });
    onDemand = false;
    renderFns: Set<Function> = new Set();
    controls: OrbitControls;
    waterGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(125 * 5, 125 * 5, 200, 200);
    waterMesh: THREE.Mesh | null = null;


    constructor(frame: HTMLDivElement) {
        this.frame = frame;
        this.camera = new THREE.PerspectiveCamera(
            40,
            this.frame.clientWidth / this.frame.clientHeight,
            0.1,
            2500
        );
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

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

    waterShader = (sunPosition: THREE.Vector3, cameraPosition: THREE.Vector3) => {
        const waterShader = {
            uniforms: {
                time: { value: 1.0 },
                resolution: { value: new THREE.Vector2() },
                uvRate1: { value: new THREE.Vector2(1.25, 1.25) },
                sunPosition: { value: sunPosition }, // Pass sun position as a uniform
                cameraPos: { value: cameraPosition }, // Pass camera position as a uniform
                reflectionTexture: { value: null }, // Reflection texture
                refractionTexture: { value: null } // Refraction texture
            },
            vertexShader,
            fragmentShader
        };

        const water = new THREE.ShaderMaterial({
            uniforms: waterShader.uniforms,
            vertexShader: waterShader.vertexShader,
            fragmentShader: waterShader.fragmentShader
        });

        return water;
    }

    initBase = async () => {
        const scene = this.scene;
        this.scene.add(new THREE.AmbientLight(0x9e9b91, 10));

        const skyController = {
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 1,
            azimuth: 195,
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

        const water = this.waterMesh = new THREE.Mesh(
            this.waterGeometry,
            this.waterShader(sunPosition, this.camera.position)
        );
        water.rotation.x = -Math.PI / 2;
        water.position.y = -2;
        scene.add(water);
        // for (let i = 0; i < 3; i++) {
        //     const clone = water.clone();
        //     clone.position.x = i * 10;
        //     scene.add(clone);
        // }

        const reflectionTexture = new THREE.WebGLRenderTarget(512, 512);
        const refractionTexture = new THREE.WebGLRenderTarget(512, 512);
        (water.material as THREE.ShaderMaterial).uniforms.reflectionTexture.value = reflectionTexture.texture;
        (water.material as THREE.ShaderMaterial).uniforms.refractionTexture.value = refractionTexture.texture;


        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0x00ff00 })
        );
        mesh.position.y = 20;
        mesh.castShadow = true;
        scene.add(mesh);

        const calcTextures = () => {
            water.visible = false;
            this.renderer.setRenderTarget(reflectionTexture);
            this.renderer.render(scene, this.camera);
            this.renderer.setRenderTarget(null);

            this.renderer.setRenderTarget(refractionTexture);
            this.renderer.render(scene, this.camera);
            this.renderer.setRenderTarget(null);
            water.visible = true;
        }

        calcTextures();
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

        //update water shader
        const time = timestamp * 0.001;
        const water = this.waterMesh;
        if(water) {
            (water.material as THREE.ShaderMaterial).uniforms.time.value = time;
            (water.material as THREE.ShaderMaterial).uniforms.cameraPos.value = this.camera.position;
        }

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
