uniform float logDepthBuffFC;
uniform vec3 color;

in float vAlpha;
in float vFragDepth;

void main() {
  // Output the color of the line
  gl_FragColor = vec4(color, vAlpha);
  gl_FragDepth = log2(vFragDepth) * logDepthBuffFC * 0.5;
}
