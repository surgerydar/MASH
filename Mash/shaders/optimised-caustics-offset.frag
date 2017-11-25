#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec4 baseColour;

uniform float qt_Opacity;

varying vec2 surfacePosition;
uniform sampler2D src;
varying vec2 texCoord;
uniform float imageMix;

uniform sampler2D noiseTexture;

float noise3D(vec3 p)
{
    p.z = fract( p.z );// * 2048.0;
    float iz = floor(p.z);
    float fz = fract(p.z);
    vec2 a_off = vec2( 23.0, 29.0 )*(iz);// / 2048.;
    vec2 b_off = vec2( 23.0, 29.0 )*(iz+1.0);// / 2048.;
    float a = texture2D(noiseTexture, p.xy + a_off).r;
    float b = texture2D(noiseTexture, p.xy + b_off).r;
    return mix(a, b, fz);
}

float perlinNoise3D(vec3 p)
{
    float x = 0.0;
    for (float i = 0.0; i < 6.0; i += 1.0)
        x += noise3D(p * pow(2.0, i)) * pow(0.5, i);
    return x;
}

float fbm ( in vec3 _st) {
    float v = 0.0;
    //float a = 0.5;
    float a = 1.;
    vec3 shift = vec3(100.0);
    // Rotate to reduce axial bias
    float r = .75*time*.000002;
    float c = cos(r);
    float s = sin(r);
    mat3 rot = mat3(
            c, 0.0, -s,
            0.0, 1.0, 0.0,
            s, 0.0, c
        );
    for (int i = 0; i < 6; ++i) {
        v += a * noise3D(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float warp( in vec3 _st ) {
    return fbm( _st + fbm( _st + fbm( _st ) ) );
}

void main( void ) {

    vec2 p = (gl_FragCoord.xy / resolution.xy)*.01;
    float v = fbm(vec3(p, time*.001));
    vec4 colour = vec4(v,v,v,1.);
    vec2 offset = texCoord*mix(colour.rg,vec2(1.),imageMix);
    if ( offset.x < 0. ) offset.x += 1.;
    if ( offset.x > 1. ) offset.x -= 1.;
    if ( offset.y < 0. ) offset.y += 1.;
    if ( offset.y > 1. ) offset.y -= 1.;
    vec4 image = texture2D( src, offset );
    vec3 finalColour = image.rgb;
    gl_FragColor = vec4(finalColour, image.a * imageMix ) * qt_Opacity;
}

