precision highp float;

#define PI 3.14159265

uniform float time;
uniform float blurStep;
uniform bool init;
uniform vec2 randomReso;
uniform float particleCountSqrt;

uniform sampler2D particleTexture;
uniform sampler2D randomTexture;
uniform sampler2D noiseTexture;

mat2 rotate( float _theta ) {
  return mat2( cos( _theta ), sin( _theta ), -sin( _theta ), cos( _theta ) );
}

void main() {
  vec2 reso = vec2( 4.0, 1.0 ) * particleCountSqrt;

  float type = mod( floor( gl_FragCoord.x ), 4.0 );

  vec3 pos = texture2D( particleTexture, ( gl_FragCoord.xy + vec2( 0.0 - type, 0.0 ) ) / reso ).xyz;
  vec3 vel = texture2D( particleTexture, ( gl_FragCoord.xy + vec2( 1.0 - type, 0.0 ) ) / reso ).xyz;
  vec3 life = texture2D( particleTexture, ( gl_FragCoord.xy + vec2( 2.0 - type, 0.0 ) ) / reso ).xyz;
  vec3 nouse = texture2D( particleTexture, ( gl_FragCoord.xy + vec2( 3.0 - type, 0.0 ) ) / reso ).xyz;

  vec3 posI = texture2D( randomTexture, ( gl_FragCoord.xy + vec2( 0.0 - type, 0.0 ) ) / randomReso ).xyz;
  posI = vec3( sin( posI.x * PI * 2.0 ), cos( posI.x * PI * 2.0 ), 0.0 ) * posI.y * 0.1;
  posI.y -= 0.65;
  vec3 velI = texture2D( randomTexture, ( gl_FragCoord.xy + vec2( 1.0 - type, 0.0 ) ) / randomReso ).xyz;
  velI = ( velI - 0.5 ) * 0.04;
  //velI += normalize( posI ) * 0.004;
  vec3 lifeI = texture2D( randomTexture, ( gl_FragCoord.xy + vec2( 2.0 - type, 0.0 ) ) / randomReso ).xyz;
  //lifeI.x = 0.001;
  vec3 nouseI = texture2D( randomTexture, ( gl_FragCoord.xy + vec2( 3.0 - type, 0.0 ) ) / randomReso ).xyz;

  vec3 ret = vec3( 0.0 );

  if ( 0.99 < life.x || init ) {
    pos = posI;
    vel = velI;
    life = lifeI;
    nouse = nouseI;
  }

  if ( type == 0.0 ) {
    float amp = exp( -( 1.0 - life.x ) * 1.0 ) * 1.0;
    pos += amp * vel / blurStep;
    ret = pos;
  } else if ( type == 1.0 ) {
    vec2 t = texture2D( noiseTexture, pos.xy * 0.25 + 0.5 ).xy;
    float amp = 0.01;
    vel.x += t.x * amp / blurStep;
    vel.y += t.y * amp / blurStep;
    vel.y += 0.0022 / blurStep;
    vel *= 1.0 - 0.1 / blurStep;
    ret = vel;
  } else if ( type == 2.0 ) {
    life.x = mod( lifeI.x - time * 1.0 + 1.0, 1.0 );
    ret = life;
  } else if ( type == 3.0 ) {
    ret = nouse;
  }

  gl_FragColor = vec4( ret, 1.0 );
}
