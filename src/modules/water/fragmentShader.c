uniform float time;
varying vec2 vUv;
varying float vZ;
float mapRange(float value, float minInput, float maxInput, float minOutput, float maxOutput) {
    return minOutput + (maxOutput - minOutput) * (value - minInput) / (maxInput - minInput);
}
void main() {
    // if (vZ < 0.0) {
    //     gl_FragColor = vec4(0.0, 0.0, 0.5, 1.0); // Dark blue
    // } else {
    //     gl_FragColor = vec4(0.5, 0.5, 1.0, 1.0); // Light blue
    // }
    gl_FragColor = vec4(0.0, mapRange(vZ, -5.0, 5.0, 0.0, 0.5), mapRange(vZ, -5.0, 5.0, 0.5, 1.0), 1.0);
    // vec3 color = vec3(0.0);
    // color.r = 0.0;
    // color.g = cos(vUv.y * 10.0 + time) * 0.5 + 0.5;
    // color.b = sin(vUv.x * 10.0 + vUv.y * 10.0 + time) * 0.5 + 0.5;
    // gl_FragColor = vec4(color, 1.0);
}
