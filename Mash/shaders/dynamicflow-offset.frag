#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

uniform float qt_Opacity;

uniform sampler2D src;
varying vec2 texCoord;
uniform float offsetX;
uniform float offsetY;
uniform float imageMix;

const float Pi = 3.14159;

void main()
{

    //float time2 = time*5.85;
    float time2 = time*2.925;
    float R = 0.374;
    float G = 0.464;
    float B = 0.142;
    vec2 p=sin(.002)*gl_FragCoord.xy;
    for(int i=1;i<9;i++)
    {
        vec2 newp=(p)*cos(Pi);
        newp.x+=-exp(sin(3.1/float(i)*sin(float(i)*p.y+(time2*3.0/10.)*(Pi)/20.0+0.3*float(i))+4.));
        newp.y+=-exp(cos(2.5/float(i)*cos(float(i)*p.x+(time2*4.0/10.)*(Pi)/20.0+0.3*float(i*10))-4.0));
        p=(newp);
    }
    //vec3 col=vec3(1.0-(R*sin(1.0*p.x)+0.5),1.0-(G*sin(1.0*p.x)+0.0),1.0-(B*sin(p.y)+0.15));

    //vec3 col=vec3((R*sin(1.0*p.x)+0.5),(G*sin(1.0*p.x)+0.0),(B*sin(p.y)+0.15));
    //vec3 col=vec3((1.0*R*sin(1.04*p.x)+0.4),(.9*G*sin(1.05*p.x)+0.25),(.5*B*sin(1.5*p.y)+.10));
    vec3 col=vec3((1.0*R*sin(1.04*p.x)+0.4),(.9*G*sin(1.05*p.x)+0.25),(.5*B*sin(1.5*p.y)+.10));


    //gl_FragColor=vec4(col/1.6, 1.0);
    vec3 colour = vec3(col/1.1);
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
