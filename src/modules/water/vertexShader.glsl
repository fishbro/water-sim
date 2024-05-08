uniform vec2 uvRate1;
uniform float time;
uniform vec3 sunPosition;
uniform vec3 cameraPos; // Rename from cameraPosition to avoid redefinition
uniform vec3 cameraTarget; // Add cameraTarget uniform

varying vec2 vUv;
varying vec3 vPos;

void main() {
    // Calculate UV coordinates
    vUv = uvRate1 * uv;

    // Initialize position
    vec3 pos = position;

    // Calculate displacement along the z-axis using sine waves
    pos.y = sin(pos.x * 0.333 + time) * 1.1 +
            sin(pos.z * 0.15 + time) * 1.1 +
            sin(pos.x * 0.24 + pos.z * 0.20 + time) * 1.1 +
            sin(pos.z * 0.5 + time) * 0.3 +
            sin(pos.x * 0.3 + pos.z * 0.7 + time) * 0.3 +
            sin(pos.x * 0.02 + pos.z * 0.02 + time) * 4.2 + // Combined two similar terms
            sin(pos.x * 0.05 + pos.z * 0.05 + time) * 5.1 +
            sin(pos.x * 0.1 + pos.z * 0.05 + time) * 7.1;

    vPos = pos;

    // Transform the position to clip space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
