uniform vec2 uUvRate1;
uniform float uTime;
uniform vec3 uSunPosition;
uniform vec3 uCameraPos; // Rename from cameraPosition to avoid redefinition
uniform vec3 uCameraTarget; // Add cameraTarget uniform

varying vec2 vUv;
varying vec3 vPos;

void main() {
    // Calculate UV coordinates
    vUv = uUvRate1 * uv;

    // Initialize position
    vec3 pos = position;

    // Calculate displacement along the z-axis using sine waves
    pos.y = sin(pos.x * 0.333 + uTime) * 1.1 +
            sin(pos.z * 0.15 + uTime) * 1.1 +
            sin(pos.x * 0.24 + pos.z * 0.20 + uTime) * 1.1 +
            sin(pos.z * 0.5 + uTime) * 0.3 +
            sin(pos.x * 0.3 + pos.z * 0.7 + uTime) * 0.3 +
            sin(pos.x * 0.02 + pos.z * 0.02 + uTime) * 4.2 + // Combined two similar terms
            sin(pos.x * 0.05 + pos.z * 0.05 + uTime) * 5.1 +
            sin(pos.x * 0.1 + pos.z * 0.05 + uTime) * 7.1;

    vPos = pos;

    // Transform the position to clip space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
