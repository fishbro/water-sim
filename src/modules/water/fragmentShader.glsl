uniform float time;
uniform vec3 sunPosition;
uniform sampler2D reflectionTexture;
uniform sampler2D refractionTexture;
uniform vec3 cameraPos; // Rename from cameraPosition to avoid redefinition
uniform vec3 cameraTarget; // Add cameraTarget varying

varying vec2 vUv;
varying vec3 vPos;

// Function to calculate the reflection vector
vec3 calculateReflection(vec3 normal, vec3 incident, vec3 cameraPos) {
    vec3 viewDir = normalize(cameraPos - vec3(vUv, vPos.y));
    return reflect(viewDir, normal);
}

// vec3 calculateReflection(vec3 normal, vec3 incident, vec3 cameraPos) {
//     //move reflections slightly to avoid artifacts
//     vec3 reflection = reflect(incident, normal);
//     vec3 viewDir = normalize(cameraPos - vec3(vUv, 0.0));
//     float cosAlpha = dot(normalize(reflection), viewDir);
//     if (cosAlpha < 0.0) {
//         reflection = reflect(-incident, normal);
//     }
//     return reflection;
// }

//calculate camera y angle
float getCameraYAngle(vec3 cameraPos, vec3 cameraTarget) {
    vec3 cameraDirection = normalize(cameraTarget - cameraPos);
    return atan(cameraDirection.z, cameraDirection.x);
}


vec2 rotateCoords(vec2 vUv){
    // Define the center of rotation (u, v)
    vec2 center = vec2(0.5, 0.5); // You can adjust this as needed

    // Define the angle of rotation in radians
    // float angle = radians(180.0); // You can change the angle as needed
    float angle = getCameraYAngle(cameraPos, cameraTarget) + radians(90.0);

    // Calculate the rotated texture coordinates
    float s = sin(angle);
    float c = cos(angle);
    vec2 rotatedUV = vec2(vUv.x - center.x, vUv.y - center.y);
    return vec2(rotatedUV.x * c - rotatedUV.y * s, rotatedUV.x * s + rotatedUV.y * c + 0.05) + center;
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
    vec3 viewDir = normalize(cameraPos - vec3(vUv, waterLevel));

    // Calculate incident light direction from the sun
    vec3 incident = normalize(sunPosition - vec3(vUv, waterLevel));

    // Calculate reflection and refraction vectors
    vec3 reflection = calculateReflection(normal, incident, cameraPos);
    vec3 refraction = calculateRefraction(normal, incident, 1.0 / waterRefractionIndex);

    // Calculate the fresnel term (reflection coefficient)
    float cosTheta = abs(dot(incident, normal));
    float fresnel = mix(0.1, 1.0, pow(1.0 - cosTheta, 5.0)); // Adjust as needed

    // Calculate final color based on reflection and refraction
    // vec3 reflectedColor = texture2D(reflectionTexture, vec2(1.0 - vUv.x, vUv.y)).rgb; // Adjust texture as needed
    vec3 reflectedColor = texture2D(reflectionTexture, rotateCoords(vUv)).rgb; // Adjust texture as needed
    vec3 refractedColor = texture2D(refractionTexture, refraction.xy).rgb; // Adjust texture as needed
    vec3 waterColor = mix(refractedColor, reflectedColor, fresnel);
    // vec3 waterColor = reflectedColor;

    // Apply sun effect
    float sunIntensity = max(0.0, dot(normalize(sunPosition - vec3(vUv, waterLevel)), -reflection));
    sunIntensity = pow(sunIntensity, 20.0); // Adjust for intensity
    vec3 sunColor = vec3(1.0, 1.0, 0.8); // Adjust for color
    waterColor += sunIntensity * sunColor;

    // Apply fog effect based on depth
    // float fogAmount = smoothstep(0.0, waterDepth, -vPos.y);
    // vec3 fogColor = vec3(0.7, 0.8, 1.0); // Adjust for color
    // waterColor = mix(waterColor, fogColor, fogAmount);

    gl_FragColor = vec4(mix(waterColor, baseColor, 0.5), 1.0);
}
