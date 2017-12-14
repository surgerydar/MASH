#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec4 baseColour;

uniform sampler2D src;
varying vec2 texCoord;
uniform float imageMix;

uniform float qt_Opacity;

varying vec2 surfacePosition;

const vec3 zero3    = vec3(0.);
const vec3 one3     = vec3(1.);

uniform sampler2D noiseTexture;
uniform vec2 noiseTextureSize;

float noise( in vec2 x ) {
    return texture2D(noiseTexture, (x/noiseTextureSize)).x;
}

//Fractal Brownian Motion
float fbm( in vec2 p) {
    float v = 0.0, f = 1.0, a = 0.5;

    for(int i = 0;i < 5; i++) {
        v += noise(p * f) * a;
        f *= 2.0;
        a *= 0.5;
    }
    return v;
}

void contrast( inout vec3 colour, in float contrast ) {
    colour =  clamp((colour - .5) * max(contrast, 0.) + .5, vec3(0.), vec3(1.));
}

void brightness( inout vec3 colour, in float brightness ) {
    colour =  clamp( colour * brightness, vec3(0.), vec3(1.));
}

//Fun start here
void main()
{
    // modify time
    float t = time;// * 0.1;

    // base texture coord
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    //uv = uv*2.0 -1.0;
    //uv = uv*.1;
    uv = uv*100.;
    uv.x *= resolution.x / resolution.y;

    // brownian motion
    float p = fbm(vec2(noise(uv+t/2.5),noise(uv*2.+cos(t/2.)/2.)));
    //uncomment for more plasma/lighting/plastic effect..
    //p = (1. - abs(p * 2.0 - 1.0))*.8;

    // colour
    vec3 col = pow(vec3(p),vec3(0.3))-0.4;
    col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.2,pow(1.0 / 2.0,0.5) - uv.y/40.0) );

    // lighten
    // TODO: enhance contrast
    //col*=1.5;
    //brightness( col, 1.5);
    //contrast( col, 8.);

    gl_FragColor = vec4(col,1.);
}
