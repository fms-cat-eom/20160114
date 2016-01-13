precision highp float;

uniform vec2 resolution;
uniform sampler2D noiseTexture;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  gl_FragColor = vec4( texture2D( noiseTexture, uv * 0.5 + 0.25 ).xy * 0.25 + 0.25, 0.0, 1.0 );
  gl_FragColor = vec4( 0.0 );
}
