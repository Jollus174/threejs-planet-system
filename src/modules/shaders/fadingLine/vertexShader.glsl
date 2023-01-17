// Calculate the angle between the vertex and the center of the circle
uniform float offset;
uniform vec2 center;

out float vAlpha;
out float vFragDepth;

vec2 rotatePoint(vec2 xy, float theta) {
  float rotatedX = 1. - cos(theta) * (xy.x - center.x) - sin(theta) * (xy.y - center.y) + center.x;
  float rotatedY = 1. - sin(theta) * (xy.x - center.x) + cos(theta) * (xy.y - center.y) + center.y;
  return vec2(rotatedX, rotatedY);
}

void main() {
  // Calculate the angle between the vertex position and the center, offset by half of the full range of the gradient
  vec2 rotatedPos = rotatePoint(position.xz, (offset * -5.));
  
  float theta = atan(rotatedPos.x, rotatedPos.y);
  
  // theta += offset - 0.5; // reduces length of line
  
  // Interpolate between the start and end alphas based on the angle
  vAlpha = mix(1., 0., theta);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  vFragDepth = 1.0 + gl_Position.w;
}
