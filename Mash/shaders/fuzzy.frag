#ifdef GL_ES
precision mediump float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 surfacePosition;
varying vec2 texCoord;

const float MATH_PI = float( 3.14159265359 );

float saturate( float x )
{
    return clamp( x, 0.0, 1.0 );
}

float Smooth( float x )
{
    return smoothstep( 0.0, 1.0, saturate( x ) );
}

float Sphere( vec3 p, float s )
{
    return length( p ) - s;
}

float UnionRound( float a, float b, float k )
{
    float h = clamp( 0.5 + 0.5 * ( b - a ) / k, 0.0, 1.0 );
    return mix( b, a, h ) - k * h * ( 1.0 - h );
}

void Rotate( inout vec2 p, float a )
{
    p = cos( a ) * p + sin( a ) * vec2( p.y, -p.x );
}

float CastRay( in vec3 ro, in vec3 rd )
{
    const float maxd = 10.0;

    float h = 1.0;
    float t = 0.0;

    for ( int i = 0; i < 50; ++i )
    {
        if ( h < 0.001 || t > maxd )
        {
            break;
        }


        t += h;
    }

    if ( t > maxd )
    {
        t = -1.0;
    }

    return t;
}



vec3 WaterKeyColor  = vec3( 0.99, 0.92, 0.98 );
vec3 WaterFillColor = vec3( 0.2, 0.06, 0.28 );

vec3 Water( vec3 rayDir )
{
    Rotate( rayDir.xy, -0.2 );
    vec3 color = mix( WaterKeyColor, WaterFillColor, Smooth( -1.2 * rayDir.y + 0.5 ) );
    return color;
}

float Circle( vec2 p, float r )
{
    return ( length( p / r ) - 1.0 ) * r;
}

void BokehLayer( inout vec3 color, vec2 p, vec3 c, float radius )
{
    float wrap = 450.0;
    if ( mod( floor( p.y / wrap + 0.5 ), 2.0 ) == 0.0 )
    {
        p.x += wrap * 0.5;
    }
    //	p.x += sin(time) * 20.0;

    vec2 p2 = mod( p + 0.5 * wrap, wrap ) - 0.5 * wrap;
    float sdf = Circle( p2, radius );
    color += c * ( 1.0 - Smooth( sdf * 0.01 ) );
}

void main( void )
{
    vec2 q = texCoord;
    vec2 p = q * 2.0;
    p.x *= resolution.x / resolution.y;

    vec3 rayOrigin	= vec3( -0.5, -0.5, -4.0 );
    vec3 rayDir 	= normalize( vec3( p.xy, 2.0 ) );

    vec3 background = Water( rayDir );

    p *= -400.0;
    Rotate( p, -0.2 );
    BokehLayer( background, p + vec2( 125.0, 120.0 * time ), vec3( 0.1 ), 0.5 );
    BokehLayer( background, p * 1.5 + vec2( 546.0, 80.0 * time ), vec3( 0.07 ), 0.25 );
    BokehLayer( background, p * 2.3 + vec2( 45.0, 50.0 * time ), vec3( 0.03 ), 0.1 );

    vec3 color = background;
    float t = CastRay( rayOrigin, rayDir );
    if ( t > 0.0 ) {
        vec3 pos = rayOrigin + t * rayDir;
        float specOcc = Smooth( 0.5 * length( pos - vec3( -0.1, -1.2, -0.2 ) ) );
        //    vec3 c0	= vec3( 0.95, 0.99, 0.43 );
        //    vec3 c1	= vec3( 0.67, 0.1, 0.05 );
        //   vec3 c2	= WaterFillColor;
   }

    gl_FragColor = vec4( color, 1.0 );
}
