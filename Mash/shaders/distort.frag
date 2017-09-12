#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D src;

uniform float qt_Opacity;

varying vec2 surfacePosition;
varying vec2 texCoord;

float circle( vec2 p, float r )
{
    return ( length( p / r ) - 1.0 ) * r;
}

void main() {
    vec2 p = texCoord;

    p.y += sin(p.y + time) * .01;

    gl_FragColor = texture2D(src, p );
}
