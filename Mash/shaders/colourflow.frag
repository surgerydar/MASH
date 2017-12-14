#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec4 baseColour;

uniform float qt_Opacity;

varying vec2 surfacePosition;

// thanks: https://wgld.org/d/glsl/

// Author: https://twitter.com/c0de4
// Otoshita
uniform sampler2D noiseTexture;
uniform vec2 noiseTextureSize;

float noise( in vec2 x ) {
    return texture2D(noiseTexture, (x/noiseTextureSize)).x;
}

void main( void ) {
        float t = time;

        vec3 p = vec3(gl_FragCoord * 6. )  / min(resolution.x, resolution.y);
        for(float i = 0.; i < 5.; i++) {
                p = abs(p*p - noise(vec2(p+i-t))) / dot(p, p) - noise(vec2(p-i/t*p*.0015)) + p + noise(vec2(-p*i+t*i));
                p.z *= noise(p.xy-t);p.z /= noise(p.yy);
        }
        gl_FragColor = vec4( baseColour.rgb*vec3( p*.1 ), 1. ) * qt_Opacity;
}
