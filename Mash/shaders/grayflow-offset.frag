#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

uniform sampler2D src;
varying vec2 texCoord;
uniform float offsetX;
uniform float offsetY;
uniform float imageMix;

uniform float qt_Opacity;

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
        float t = time * .1;

        vec3 p = vec3(gl_FragCoord * 2. )  / min(resolution.x, resolution.y);
        for(float i = 0.; i < 4.; i++) {
                p = vec3(0.1*i, 0.4, sin(t*i)) + abs(p*p - n(vec2(p+i-t))) / dot(p/(i+1.), p+p/t/(i+1.)/(i+1.)) * n(vec2(p-i/t*p*.0015)) + p * n(vec2(p+t));
                p.z = n(p.xy-t);p.z += n(p.yy);
        }

        vec3 colour = vec3( p.xxx*.4 * p.yyy * p.zzz * .4 );
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
