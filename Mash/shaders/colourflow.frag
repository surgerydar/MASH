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


float random (in vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))
                 * 43758.5453123);
}

// The MIT License
// Copyright © 2013 Inigo Quilez
float n( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );

    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( random( i + vec2(0.0,0.0) ),
                     random( i + vec2(1.0,0.0) ), u.x),
                mix( random( i + vec2(0.0,1.0) ),
                     random( i + vec2(1.0,1.0) ), u.x), u.y);
}

void main( void ) {
        float t = time;

        vec3 p = vec3(gl_FragCoord * 6. )  / min(resolution.x, resolution.y);
        for(float i = 0.; i < 5.; i++) {
                p = abs(p*p - n(vec2(p+i-t))) / dot(p, p) - n(vec2(p-i/t*p*.0015)) + p + n(vec2(-p*i+t*i));
                p.z *= n(p.xy-t);p.z /= n(p.yy);
        }


        //gl_FragColor = vec4( vec3( p*.1 ), 1. ) * qt_Opacity;
        gl_FragColor = vec4( baseColour.rgb*vec3( p*.1 ), 1. ) * qt_Opacity;
}
