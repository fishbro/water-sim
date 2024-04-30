uniform vec2 uvRate1;
uniform float time;
uniform vec3 sunPosition;
uniform vec3 cameraPos; // Rename from cameraPosition to avoid redefinition
uniform vec3 cameraTarget; // Add cameraTarget uniform

varying vec2 vUv;
varying float vZ;
varying vec3 vNormal;

void main() {
    // Calculate UV coordinates
    vUv = uvRate1 * uv;

    // Initialize position
    vec3 pos = position;

    // Calculate displacement along the z-axis using sine waves
    pos.z = sin(pos.x * 0.333 + time) * 1.1 +
            sin(pos.y * 0.15 + time) * 1.1 +
            sin(pos.x * 0.24 + pos.y * 0.20 + time) * 1.1 +
            sin(pos.y * 0.5 + time) * 0.3 +
            sin(pos.x * 0.3 + pos.y * 0.7 + time) * 0.3 +
            sin(pos.x * 0.02 + pos.y * 0.02 + time) * 4.2 + // Combined two similar terms
            sin(pos.x * 0.05 + pos.y * 0.05 + time) * 5.1 +
            sin(pos.x * 0.1 + pos.y * 0.05 + time) * 7.1;

    // Calculate finite differences for tangent vectors
    float dx = 0.01;
    float dy = 0.01;
    vec3 dxVec = vec3(dx, 0.0, sin((pos.x + dx) * 0.333 + time) * 1.1);
    vec3 dyVec = vec3(0.0, dy, sin((pos.y + dy) * 0.15 + time) * 1.1);
    vec3 tangent1 = normalize(dxVec - pos);
    vec3 tangent2 = normalize(dyVec - pos);

    // Calculate normal using cross product of tangent vectors
    vNormal = normalize(cross(tangent1, tangent2));

    // Pass z-coordinate to the fragment shader
    vZ = pos.z;

    // Transform the position to clip space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
