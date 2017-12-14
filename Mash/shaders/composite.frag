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

vec3 underwater( vec2 uv ) {
    float gtime = time * .5+23.0;
    vec2 p = mod(uv*TAU, TAU)-250.0;
    vec2 i = vec2(p);
    float c = 1.0;
    float inten = .008;

    for (int n = 0; n < MAX_ITER; n++) {
        float t = gtime * (0.0 - (3.0 / float(n+1)));
        i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
        c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 p = mod(uv*TAU, TAU)-250.0;
        vec2 i = vec2(p);
        float c = 1.0;
        float inten = .008;

        for (int n = 0; n < MAX_ITER; n++)
        {
            float t = gtime * (0.0 - (3.0 / float(n+1)));
            i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
            c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
        }
        c /= float(MAX_ITER);
        c = 1.17-pow(c, 1.4);
        vec3 colour = vec3(pow(abs(c), 8.0));
    }
    c /= float(MAX_ITER);
    c = 1.17-pow(c, 1.4);
    vec3 colour = vec3(pow(abs(c), 8.0));
    colour = clamp(colour + vec3(0.00125, 0.00025, 0.00025), 0.0, 1.0);

    return colour;
}

float hash( vec2 p)
{
    vec3 p2 = vec3(p.xy,1.0);
    return fract(sin(dot(p2,vec3(37.1,61.7, 12.4)))*3758.5453123);
}

float noise(in vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f *= f * (3.0-2.0*f);

    return mix(mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)),f.x),
               mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)),f.x),
               f.y);
}

float fbm(vec2 p)
{
    float v = 0.0;
    v += noise(p*1.0)*.5;
    //v += noise(p*2.)*.25;
    //v += noise(p*4.)*.125;
    return v * 1.0;
}

vec3 lines( vec2 uv )
{

    uv = uv * 2.0 - 1.0;
    uv.x *= resolution.x/resolution.y;


    vec3 finalColor = vec3( 0.0 );
    for( int i=1; i < 4; ++i )
    {
        float hh = float(i) * 0.1;
        float t = abs(1.0 / ((uv.x + fbm( uv + (time*0.25)/float(i)))*75.));
        finalColor +=  t * vec3( hh+0.1, 0.5, 2.0 );
    }

    return finalColor;
}

void main( void ) {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec3 c1 = underwater(uv);
    vec3 c2 = lines(uv);

    float shadermix = mouse.y / resolution.y;
    gl_FragColor = vec4( mix( c1, c2, shadermix ), qt_Opacity);
}

