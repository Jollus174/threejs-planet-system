varying float intensity;
void main() {
  vec3 glow = vec3(0.25, 0.25 * 0.25, 0.25 * 0.25 * 0.25 * 0.25) * intensity;
  gl_FragColor = vec4( glow, 1.0 );
}
