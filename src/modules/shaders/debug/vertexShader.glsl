out vec3 vNormal; 
out float vFragDepth;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 

  vNormal = normal;
  vFragDepth = 1.0 + gl_Position.w;
}