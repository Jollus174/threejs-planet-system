varying vec3 vertexNormal;

void main() {
  // vertexNormal = normal;
  vertexNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}