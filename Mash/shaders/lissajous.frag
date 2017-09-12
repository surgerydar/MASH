// Playing around with Lissajous curves.
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

varying vec2 surfacePosition;

const int num = 400;

void main( void ) {
    float sum = -0.5;
    float size = resolution.x / 1000.0;
    for (int i = 0; i < num; ++i) {
        vec2 position = resolution / 2.0;
        float t = (float(i) + time) / 27.0;
        float c = float(i) * 4.0;
        position.x += tan((sin(t)+8.0) * t + c) * resolution.x * 0.275;
        position.y += sin(t*t) * resolution.y * (2.0+sin(t)) * 0.058;

        sum += size / length(surfacePosition.xy - position);
    }
    gl_FragColor = vec4(sum * 0.1, sum * 0.5, sum, 1);
}
