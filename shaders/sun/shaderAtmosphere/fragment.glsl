uniform float time;
uniform float progress;
uniform sampler2D globeTexture;
uniform vec4 resolution;
uniform samplerCube uPerlin;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vLayer0;
varying vec3 vLayer1;
varying vec3 vLayer2;
varying vec3 eyeVector;
varying vec3 vertexNormal;

// magic formula that converts float value to colour of the sun
vec3 brightnesstoColor(float b) {
  b *= 0.25;
  return (vec3(b, b*b, b*b*b*b)/0.25)*0.6;
}

void main() {
  float radial = 1. - vPosition.z;
  radial *= radial * radial;
  float brightness = 1. * radial*0.5;

  float intensity = pow(0.65 - dot(vertexNormal, vec3(0, 0, 1.0)), 2.0);
  gl_FragColor = vec4(brightnesstoColor(brightness), 1.0) * intensity;
}