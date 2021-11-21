varying vec2 vUv;
varying vec3 vertexNormal;
varying vec3 vPosition;


void main() {
  vUv = uv;
  vPosition = position;
  // vertexNormal = normal;
  vertexNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}