uniform float uTime;
uniform vec3 uSunPosition;
uniform sampler2D uReflectionTexture;
uniform sampler2D uRefractionTexture;
uniform vec3 uCameraPos; // Rename from cameraPosition to avoid redefinition
uniform vec3 uCameraTarget; // Add cameraTarget uniform
uniform vec2 uViewSize;

varying vec2 vUv;
varying vec3 vPos;

const float PI = 3.14159265359;

// Function to calculate the reflection vector
vec3 calculateReflection(vec3 normal, vec3 incident, vec3 cameraPos) {
    vec3 viewDir = normalize(cameraPos - vec3(vUv, vPos.y));
    return reflect(viewDir, normal);
}

vec2 projectCoords(vec3 normal) {
    vec2 pixelCoords = gl_FragCoord.xy;
    vec2 reflectCoords = (pixelCoords / uViewSize) * 0.5;
    vec2 verticalOffset = normal.xy * 0.1;
    float cameraVerticalAngle = acos(dot(normalize(uCameraPos), vec3(0.0, 1.0, 0.0)));
    float verticalOffsetFactor = smoothstep(0.0, 1.0, cameraVerticalAngle / (PI / 4.0));

    vec2 projectedCoords = reflectCoords + verticalOffset * verticalOffsetFactor;
    vec2 invertedCoords = vec2(projectedCoords.x, 1.0 - projectedCoords.y);

    // Clamp to avoid artifacts
    projectedCoords = clamp(projectedCoords, 0.0, 1.0);

    //more verticalOffsetFactor - more invertedCoords.y
    float yCoord = mix(invertedCoords.y, projectedCoords.y, 0.0);

    return vec2(projectedCoords.x, yCoord);
}

// Function to calculate the refraction vector
vec3 calculateRefraction(vec3 normal, vec3 incident, float eta) {
    float cosI = dot(normal, incident);
    float cosT2 = 1.0 - eta * eta * (1.0 - cosI * cosI);
    if (cosT2 < 0.0) return vec3(0.0);
    return eta * incident - (eta * cosI + sqrt(cosT2)) * normal;
}

float mapRange(float value, float minInput, float maxInput, float minOutput, float maxOutput) {
    return minOutput + (maxOutput - minOutput) * (value - minInput) / (maxInput - minInput);
}

void main() {
    // Define water properties
    float waterLevel = 0.0; // Adjust as needed
    float waterDepth = 10.0; // Adjust as needed
    float waterRefractionIndex = 1.33; // Typical value for water
    vec3 baseColor = vec3(0.0, mapRange(vPos.y, -10.0, 10.0, 0.0, 0.5), mapRange(vPos.y, -10.0, 10.0, 0.2, 0.6));

    // Calculate the normal vector
    vec3 dX = dFdx(vPos);
    vec3 dY = dFdy(vPos);
    vec3 normal = normalize(cross(dX, dY));

    // Calculate view direction
    vec3 viewDir = normalize(uCameraPos - vec3(vUv, waterLevel));

    // Calculate incident light direction from the sun
    vec3 incident = normalize(uSunPosition - vec3(vUv, waterLevel));

    // Calculate reflection and refraction vectors
    vec3 reflection = calculateReflection(normal, incident, uCameraPos);
    vec3 refraction = calculateRefraction(normal, incident, 1.0 / waterRefractionIndex);

    // Calculate the fresnel term (reflection coefficient)
    float cosTheta = abs(dot(incident, normal));
    float fresnel = mix(0.1, 1.0, pow(1.0 - cosTheta, 5.0)); // Adjust as needed

    // Calculate final color based on reflection and refraction
    vec3 reflectedColor = texture2D(uReflectionTexture, projectCoords(normal)).rgb; // Adjust texture as needed
    vec3 refractedColor = texture2D(uRefractionTexture, refraction.xy).rgb; // Adjust texture as needed
    vec3 waterColor = mix(refractedColor, reflectedColor, fresnel);
    // vec3 waterColor = reflectedColor;

    // Apply sun effect
    float sunIntensity = max(0.0, dot(normalize(uSunPosition - vec3(vUv, waterLevel)), -reflection));
    sunIntensity = pow(sunIntensity, 20.0); // Adjust for intensity
    vec3 sunColor = vec3(1.0, 1.0, 0.8); // Adjust for color
    waterColor += sunIntensity * sunColor;

    // Apply fog effect based on depth
    // float fogAmount = smoothstep(0.0, waterDepth, -vPos.y);
    // vec3 fogColor = vec3(0.7, 0.8, 1.0); // Adjust for color
    // waterColor = mix(waterColor, fogColor, fogAmount);

    gl_FragColor = vec4(mix(waterColor, baseColor, 0.5), 1.0);
}
