precision highp float;

#define saturate(i) clamp(i,0.,1.)

uniform vec2 resolution;
uniform sampler2D texture;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 ret = texture2D( texture, uv ).xyz;
  vec3 h = normalize( ret );
  float l = length( ret );
  l = pow( l * 1.6, 0.8 );
  if ( true ) {
    gl_FragColor = vec4( saturate( h * l ), 1.0 );
  } else {
    gl_FragColor = vec4( ret, 1.0 );
  }
}
