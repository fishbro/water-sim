uniform float time;
uniform vec3 sunPosition;
uniform sampler2D reflectionTexture;
uniform sampler2D refractionTexture;
uniform vec3 cameraPos; // Rename from cameraPosition to avoid redefinition
uniform vec3 cameraTarget; // Add cameraTarget varying

varying vec2 vUv;
varying float vZ;

// Function to calculate the reflection vector
vec3 calculateReflection(vec3 normal, vec3 incident, vec3 cameraPos) {
    vec3 viewDir = normalize(cameraPos - vec3(vUv, vZ));
    return reflect(viewDir, normal);
}

// Function to calculate the refraction vector
vec3 calculateRefraction(vec3 normal, vec3 incident, float eta) {
    float cosI = dot(normal, incident);
    float cosT2 = 1.0 - eta * eta * (1.0 - cosI * cosI);
    if (cosT2 < 0.0) return vec3(0.0);
    return eta * incident - (eta * cosI + sqrt(cosT2)) * normal;
}

void main() {
    // Define water properties
    float waterLevel = 0.0; // Adjust as needed
    float waterDepth = 10.0; // Adjust as needed
    float waterRefractionIndex = 1.33; // Typical value for water

    // Calculate view direction
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0)); // Assuming camera looks down the positive z-axis

    // Calculate surface normal
    vec3 normal = normalize(vec3(dFdx(vUv.x), dFdy(vUv.y), 1.0));

    // Calculate incident light direction from the sun
    vec3 incident = normalize(sunPosition - vec3(vUv, waterLevel));

    // Calculate reflection and refraction vectors
    vec3 reflection = calculateReflection(normal, incident, cameraPos);
    vec3 refraction = calculateRefraction(normal, incident, 1.0 / waterRefractionIndex);

    // Calculate the fresnel term (reflection coefficient)
    float cosTheta = abs(dot(incident, normal));
    float fresnel = mix(0.1, 1.0, pow(1.0 - cosTheta, 5.0)); // Adjust as needed

    // Calculate final color based on reflection and refraction
    vec3 reflectedColor = texture2D(reflectionTexture, reflect(vUv, reflection.xy)).rgb; // Adjust texture as needed
    vec3 refractedColor = texture2D(refractionTexture, refraction.xy).rgb; // Adjust texture as needed
    vec3 waterColor = mix(refractedColor, reflectedColor, fresnel);

    // Apply sun effect
    float sunIntensity = max(0.0, dot(normalize(sunPosition - vec3(vUv, waterLevel)), -reflection));
    sunIntensity = pow(sunIntensity, 20.0); // Adjust for intensity
    vec3 sunColor = vec3(1.0, 1.0, 0.8); // Adjust for color
    waterColor += sunIntensity * sunColor;

    // Apply fog effect based on depth
    float fogAmount = smoothstep(0.0, waterDepth, -vZ);
    vec3 fogColor = vec3(0.7, 0.8, 1.0); // Adjust for color
    waterColor = mix(waterColor, fogColor, fogAmount);

    gl_FragColor = vec4(waterColor, 1.0);
}
