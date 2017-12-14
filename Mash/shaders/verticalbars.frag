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

uniform sampler2D noiseTexture;
uniform vec2 noiseTextureSize;

float noise( in vec2 x ) {
    return texture2D(noiseTexture, (x/noiseTextureSize)).x;
}

mat2 rotate(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

void contrast( inout vec3 colour, in float contrast ) {
    colour =  clamp((colour - .5) * max(contrast, 0.) + .5, vec3(0.), vec3(1.));
}

void brightness( inout vec3 colour, in float brightness ) {
    colour =  clamp( colour * brightness, vec3(0.), vec3(1.));
}

float ltime = 0.;

float fbm(vec2 p) {
    p *= 1.1;
    float f = 0.;
    float amp = .5;
    for( float i = 0.; i < 3.; i++) {
        mat2 modify = rotate(ltime/50. * (i*i));
        f += amp*noise(p);
        p = modify * p;
        p *= 2.;
        amp /= 2.2;
    }
    return f;
}

float pattern(vec2 st, vec2 v, float t) {
    vec2 p = floor(st+v);
    return step(t, noise(100.+p*.000001)+noise(p)*0.5 );
}

float random (in vec2 st) {
    //return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
    return noise(st);
}

float randomSerie(float x, float freq, float t) {
    return step(.8,random( vec2(floor(x*freq)-floor(t) )));
}

float bars( in float x ) {
    //return smoothstep( .5, 1., (sin(-time*1.+x*1.)*.33)+(cos(time*1.1*+x*3.)*.33)+(sin(-time*1.3+x*7.)*.33)+(cos(time*1.5+x*13.)*.33));
    //return smoothstep( 0., 1., (sin(-time*1.+x*1.)*.33)+(cos(time*1.1*+x*3.)*.33)+(sin(-time*1.3+x*7.)*.33)+(cos(time*1.5+x*13.)*.33));
    return (sin(-time*1.+x*1.)*.33)+(cos(time*1.1*+x*3.)*.33)+(sin(-time*1.3+x*7.)*.33)+(cos(time*1.5+x*13.)*.33);
}

void main() {
    vec2 st = gl_FragCoord.xy/resolution.xy;
    st.x *= resolution.x/resolution.y;

    vec3 colour = vec3(clamp(bars(st.x),0.,1.));

    vec4 image = texture2D( src, texCoord );
    vec4 finalColour = vec4(colour, 1.0) + image;
    gl_FragColor = finalColour * qt_Opacity;
}
