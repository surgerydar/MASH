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
    /*
    vec2 p = texCoord - .5;
    vec2 s = vec2( p.x * cos( time ) - p.y * sin( time ), p.y * cos( time ) + p.x * sin( time ) );
    //s += .5;
    float radius = .001;
    float dist = distance( s, p );
    float att = clamp(1.0 - dist/radius, 0.0, 1.0);
    att *= att;
    if ( att > 0. ) {
        gl_FragColor = vec4( texture2D(src, texCoord).rgb * att, qt_Opacity );
    } else {
        gl_FragColor = vec4( 0.);
    }
    */
    const float nBalls = 6.;
    float inc = .5 / nBalls;
    float radius = inc / 2.1;
    vec2 p = vec2( inc, 0. );
    vec3 c = texture2D(src, texCoord).rgb;
    vec3 final = vec3( 0. );
    vec3 base = vec3( 0.12, 0.42, 0.74 );
    for ( float i = 0.; i < nBalls; i++ ) {
        vec2 s = vec2( p.x * cos( time ) - p.y * sin( time ), p.y * cos( time ) + p.x * sin( time ) );
        s += .5;
        float dist = distance( s, texCoord );
        float att = clamp(1. - dist/radius, 0., 1.);
        if ( att > 0. ) {
            att *= att;
            final += mix( base, c, att );//vec4( c * att, qt_Opacity );
        }
        p.x += inc;
    }
    if ( length(final) > 0. ) {
        gl_FragColor = vec4( final, qt_Opacity );
    } else {
        gl_FragColor = vec4( 0. );
    }
}
