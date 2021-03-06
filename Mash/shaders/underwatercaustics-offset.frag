#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

uniform sampler2D src;
uniform float offsetX;
uniform float offsetY;
uniform float imageMix;

uniform float qt_Opacity;

varying vec2 surfacePosition;
varying vec2 texCoord;

const float TAU = 6.28318530718;
const int MAX_ITER = 2;

vec2 distort( in vec2 p, in float offset ) {
    p -= .5;
    p *= offset + 1.;
    p += .5;
    return p;
}

void main( void ) {
    float gtime = time * .5+23.0;
    // uv should be the 0-1 uv of texture...
    vec2 uv = (gl_FragCoord.xy / resolution.xy);
    uv.x *= resolution.x/resolution.y;
    vec2 p = mod(uv*TAU, TAU)-250.0;
    vec2 i = vec2(p);
    float c = 1.0;
    const float inten = .008;

    for (int n = 0; n < MAX_ITER; n++) {
        float t = gtime * (0.0 - (3.0 / float(n+1)));
        i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
        c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
        for (int j = 0; j < MAX_ITER; j++) {
            t = gtime * (0.0 - (3.0 / float(j+1)));
            i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
        }
    }
    c /= float(MAX_ITER);
    c = 1.17-pow(c, 1.4);
    //
    //
    //
    vec2 distorted = distort( texCoord, c );
    vec2 offset = texCoord*mix(distorted,vec2(1.),imageMix);
    vec4 image = texture2D( src, offset );
    vec3 finalColour = image.rgb;
    gl_FragColor = vec4(finalColour, image.a * imageMix ) * qt_Opacity;

}
