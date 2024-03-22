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

export default class SceneConstructor {
    frame;
    active = true;
    scene = new THREE.Scene();
    camDef = new THREE.Vector3(0, 0, 5);
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

    waterShader = () => {
        const waterShader = {
            uniforms: {
                time: { value: 1.0 },
                resolution: { value: new THREE.Vector2() },
                uvRate1: { value: new THREE.Vector2(1.25, 1.25) }
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

        const water = this.waterMesh = new THREE.Mesh(
            this.waterGeometry,
            this.waterShader()
        );
        water.rotation.x = -Math.PI / 2;
        water.position.y = -2;
        scene.add(water);
        // for (let i = 0; i < 3; i++) {
        //     const clone = water.clone();
        //     clone.position.x = i * 10;
        //     scene.add(clone);
        // }

        // const mesh = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshLambertMaterial({ color: 0x00ff00 })
        // );
        // mesh.position.y = -1;
        // mesh.castShadow = true;
        // scene.add(mesh);


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
        const floor = this.waterMesh;
        if(floor)
        (floor.material as THREE.ShaderMaterial).uniforms.time.value = time;

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
