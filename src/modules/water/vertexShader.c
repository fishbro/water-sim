uniform vec2 uvRate1;
uniform float time;
varying vec2 vUv;
varying float vZ;
void main() {
    vUv = uvRate1 * uv;
    vec3 pos = position;
    pos.z = sin(pos.x * 0.333 + time) * 1.1;
    pos.z += sin(pos.y * 0.15 + time) * 1.1;
    pos.z += sin(pos.x * 0.24 + pos.y * 0.20 + time) * 1.1;
    pos.z += sin(pos.y * 0.5 + time) * 0.3;
    pos.z += sin(pos.x * 0.3 + pos.y * 0.7 + time) * 0.3;
    pos.z += sin(pos.x * 0.02 + pos.y * 0.02 + time) * 2.1;
    pos.z += sin(pos.x * 0.05 + pos.y * 0.05 + time) * 5.1;
    pos.z += sin(pos.x * 0.1 + pos.y * 0.05 + time) * 7.1;
    // pos.z += sin(pos.y * 1.0 + time) * 0.1;
    // pos.z += sin(pos.x * 1.0 + pos.y * 1.0 + time) * 0.1;
    vZ = pos.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
