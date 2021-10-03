uniform float time;
varying vec2 vUv;
varying vec3 vertexNormal;
varying vec3 vPosition;

varying vec3 vLayer0;
varying vec3 vLayer1;
varying vec3 vLayer2;
varying vec3 eyeVector;
varying vec3 vNormal;

// for rotating something 2-dimensional
mat2 rotate(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c,-s,s,c);
}

void main() {
  vNormal = normal;

  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  eyeVector = normalize(worldPosition.xyz - cameraPosition);

  float t = time*0.01;
  mat2 rot = rotate(t);

  vec3 p0 = position;
  p0.yz = rot*p0.yz; // rotating around x-axis
  vLayer0 = p0;

  vec3 p1 = position;
  p1.xz = rot*p1.xz; // rotating around y (note missing y)
  vLayer1 = p1;

  vec3 p2 = position;
  p2.xy = rot*p2.xy; // rotating around z
  vLayer2 = p2;

  vUv = uv;
  vPosition = position;
  // vertexNormal = normal;
  vertexNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}