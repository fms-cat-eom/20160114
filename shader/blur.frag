precision highp float;

uniform bool init;
uniform float add;
uniform float blurStep;
uniform vec2 resolution;
uniform sampler2D postTexture;
uniform sampler2D blurTexture;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 ret = texture2D( postTexture, uv ).xyz * add;
  ret += texture2D( blurTexture, uv ).xyz * ( 1.0 - 0.3 / blurStep );
  gl_FragColor = vec4( ret, 1.0 );
}
