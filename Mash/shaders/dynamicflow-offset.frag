#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec4 baseColour;

uniform float qt_Opacity;

uniform sampler2D src;
varying vec2 texCoord;
uniform float offsetX;
uniform float offsetY;
uniform float imageMix;

const float Pi = 3.14159;

vec2 distort( in vec2 p, in float offset ) {
    p -= .5;
    p *= offset + 1.;
    p += .5;
    return p;
}

void main()
{
    float time2 = time*2.925;
    vec2 posn = gl_FragCoord.xy + vec2(offsetX,offsetY);
    vec2 p=sin(.002)*posn;
    for(int i=1;i<9;i++) {
        vec2 newp=p*cos(Pi); // rotate point???
        newp.x+=-exp(sin(3.1/float(i)*sin(float(i)*p.y+(time2*3.0/10.)*(Pi)/20.0+0.3*float(i))+4.));
        newp.y+=-exp(cos(2.5/float(i)*cos(float(i)*p.x+(time2*4.0/10.)*(Pi)/20.0+0.3*float(i*10))-4.0));
        p=newp;
    }
    float val = abs(p.x*p.y);
    vec4 colour=vec4(val,val,val,1.);
    //
    //
    //
    vec2 distorted = distort( texCoord, val );
    vec2 offset = texCoord*mix(distorted,vec2(1.),imageMix);
    /*
    if ( offset.x < 0. ) offset.x += 1.;
    if ( offset.x > 1. ) offset.x -= 1.;
    if ( offset.y < 0. ) offset.y += 1.;
    if ( offset.y > 1. ) offset.y -= 1.;
    */
    vec4 image = texture2D( src, offset );
    vec3 finalColour = image.rgb;
    gl_FragColor = vec4(finalColour, image.a * imageMix ) * qt_Opacity;
}
