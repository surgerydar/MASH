#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

uniform float qt_Opacity;

varying vec2 surfacePosition;

const float TAU = 6.28318530718;
const int MAX_ITER = 5;

void main( void ) {
    float gtime = time * .5+23.0;
    // uv should be the 0-1 uv of texture...
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 p = mod(uv*TAU, TAU)-250.0;
    vec2 i = vec2(p);
    float c = 1.0;
    float inten = .008;

    for (int n = 0; n < MAX_ITER; n++) {
        float t = gtime * (0.0 - (3.0 / float(n+1)));
        i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
        c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
        //vec2 uv = gl_FragCoord.xy / resolution.xy;
        //vec2 p = mod(uv*TAU, TAU)-250.0;
        i = vec2(p);
        float c = 1.0;
        float inten = .008;

        //for (int n = 0; n < MAX_ITER; n++) {
        for (int j = 0; j < MAX_ITER; j++) {
            float t = gtime * (0.0 - (3.0 / float(j+1)));
            i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
            c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
        }
        c /= float(MAX_ITER);
        c = 1.17-pow(c, 1.4);
    }
    c /= float(MAX_ITER);
    c = 1.17-pow(c, 1.4);
    vec3 colour = vec3(pow(abs(c), 8.0));
    colour = clamp(colour + vec3(0.00125, 0.00025, 0.00025), 0.0, 1.0);

    gl_FragColor = vec4(colour, 1.0);
}
