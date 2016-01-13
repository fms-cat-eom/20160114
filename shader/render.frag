precision highp float;

uniform sampler2D noiseTexture;

varying vec3 vVel;
varying float vBrig;

#define PI 3.14159265
#define saturate(i) clamp(i,0.,1.)

vec3 catColor( float _theta ){
  return vec3(
    sin( _theta ),
    sin( _theta + 2.0 ),
    sin( _theta + 4.0 )
  ) * 0.5 + 0.5;
}

void main() {
  float v = saturate( length( vVel ) * 10.0 );
  vec3 color = saturate( catColor( v * 4.0 + 1.0 ) * pow( v, 0.1 ) );
  float e = 1.0;
  float shape = exp( -length( gl_PointCoord - 0.5 ) * e * 2.0 );
  shape = ( shape - exp( -e ) ) / ( 1.0 - exp( -e ) );
  shape = saturate( shape * 4.0 );
  gl_FragColor = vec4( color * shape * vBrig * 0.04, 1.0 );
}
