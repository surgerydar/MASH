#ifdef GL_ES
precision mediump float;
#endif
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float NUMBALLS = 2.;
const float NUMBALLSHIGHT = 5.;
const float TWO_PI = 6.283185;
const float d = -TWO_PI/3.0;

void main( void ) {
    vec2 p = gl_FragCoord.xy/resolution;
    vec2 q;
    vec3 c = vec3(0); //ftfy
    for(float r = 0.0; r < NUMBALLSHIGHT; r++) {
        for(float i = 0.0; i < NUMBALLS; i++) {
            float t = d * i / NUMBALLS + ((time-r));
            c += 0.0457/distance(p, (1.4*.2 + r * .1) * vec2(cos(t) * sin(t), sin(t)));
        }
    }
    gl_FragColor = vec4(c * vec3(0.1, 0.8, 1.2), 1.0 * c.r);

    //gl_FragColor *= dot(gl_FragColor,gl_FragColor.gbra);

}
