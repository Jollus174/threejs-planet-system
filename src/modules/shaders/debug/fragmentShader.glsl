uniform float logDepthBuffFC;

in vec3 vNormal;
in float vFragDepth;

void main() {
  gl_FragColor = vec4(vNormal, 1.0);
  gl_FragDepth = log2(vFragDepth) * logDepthBuffFC * 0.5;
}