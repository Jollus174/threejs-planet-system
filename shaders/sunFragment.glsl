uniform float time;
uniform float progress;
uniform sampler2D globeTexture;
uniform vec4 resolution;
varying vec2 vUv;
uniform vec3 vPosition;
varying vec3 vertexNormal;
float PI = 3.141592654;

void main() {
  float intensity = .03 - dot(vertexNormal, vec3(0.0, 0.0, 0.75 ));
  vec3 atmosphere = vec3(1, 0.6, 0.2) * pow(intensity, 1.8);
  gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vUv).xyz, 1.0);
}