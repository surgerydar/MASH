#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec4 baseColour;

uniform float qt_Opacity;

varying vec2 surfacePosition;

uniform sampler2D src;
varying vec2 texCoord;
uniform float imageMix;

const float Pi = 3.14159;

void main() {
    float time2 = time*2.925;
    vec2 p=sin(.002)*gl_FragCoord.xy;
    for(int i=1;i<9;i++) {
        vec2 newp=p*cos(Pi); // rotate point???
        newp.x+=-exp(sin(3.1/float(i)*sin(float(i)*p.y+(time2*3.0/10.)*(Pi)/20.0+0.3*float(i))+4.));
        newp.y+=-exp(cos(2.5/float(i)*cos(float(i)*p.x+(time2*4.0/10.)*(Pi)/20.0+0.3*float(i*10))-4.0));
        p=newp;
    }
    float val = abs(p.x*p.y);
    val /= 9.;
    vec3 colour = clamp(baseColour.rgb*val, 0., 1. );
    //vec3 colour = vec3(abs(val));
    //colour = clamp(colour * baseColour.rgb, 0.0, 1.0);


    vec4 image = texture2D( src, texCoord );
    vec4 finalColour = vec4(colour, 1.0) + image;
    gl_FragColor = finalColour * qt_Opacity;

}
