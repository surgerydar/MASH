#ifdef GL_ES
precision mediump float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec4 baseColour;

uniform float qt_Opacity;

varying vec2 surfacePosition;

uniform sampler2D src;
varying vec2 texCoord;
uniform float offsetX;
uniform float offsetY;
uniform float imageMix;

// smoke
const int ITER_FRAGMENT = 3;
const float SMOKE_HEIGHT = .4;
const float SMOKE_CHOPPY = 2.0;
const float SMOKE_FREQ = 0.15;
float SEA_TIME = 21.;
mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

float hash( vec2 p ) {
        float h = dot(p,vec2(127.1,311.7));
    return fract(sin(h)*43758.5453123);
}

float noise( in vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );
        vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ),
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ),
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv,swv,wv);
    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}

float map_detailed(vec3 p) {
    float freq = SMOKE_FREQ;
    float amp = SMOKE_HEIGHT;
    float choppy = SMOKE_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;

    float d, h = 0.0;
    for(int i = 0; i < ITER_FRAGMENT; i++) {
        d = sea_octave((uv+SEA_TIME)*freq,choppy);
        d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;
        uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

void main( void ) {
        vec2 res = resolution * 4.;
        vec2 coord = surfacePosition.xy;//gl_FragCoord.xy;
        float t = time;
        float noiseVal = (1.0 - coord.y / res.y);
        float x =coord.x / 12.-t + sin(coord.x*0.01+t*0.1);
        float y = pow(noiseVal + noise(vec2(1.0,0.0)+coord.xy/res) * noiseVal + sin(coord.y*0.0001), 0.6);
        float z = coord.y / 10.-t + cos(coord.x*0.01+t*0.1);
        vec3 colour = vec3( map_detailed(vec3(x, y, z)));
        //
        //
        //
        vec2 offset = texCoord*mix(colour.rg,vec2(1.),imageMix);
        if ( offset.x < 0. ) offset.x += 1.;
        if ( offset.x > 1. ) offset.x -= 1.;
        if ( offset.y < 0. ) offset.y += 1.;
        if ( offset.y > 1. ) offset.y -= 1.;
        vec4 image = texture2D( src, offset );
        vec3 finalColour = image.rgb;
        gl_FragColor = vec4(finalColour, image.a * imageMix ) * qt_Opacity;
}
