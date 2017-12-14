#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec4 baseColour;

uniform sampler2D src;
varying vec2 texCoord;
uniform float imageMix;

uniform float qt_Opacity;

varying vec2 surfacePosition;

uniform sampler2D noiseTexture;
uniform vec2 noiseTextureSize;

float noise( in vec2 x ) {
    return texture2D(noiseTexture, (x/noiseTextureSize)).x;
}

mat2 rotate(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

void contrast( inout vec3 colour, in float contrast ) {
    colour =  clamp((colour - .5) * max(contrast, 0.) + .5, vec3(0.), vec3(1.));
}

void brightness( inout vec3 colour, in float brightness ) {
    colour =  clamp( colour * brightness, vec3(0.), vec3(1.));
}

float ltime = 0.;

float fbm(vec2 p) {
    p *= 1.1;
    float f = 0.;
    float amp = .5;
    for( float i = 0.; i < 3.; i++) {
        mat2 modify = rotate(ltime/50. * (i*i));
        f += amp*noise(p);
        p = modify * p;
        p *= 2.;
        amp /= 2.2;
    }
    return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r) {
    q = vec2( fbm(p + vec2(1.)),
              fbm(rotate(.1*ltime)*p + vec2(3.)));
    r = vec2( fbm(rotate(.2)*q + vec2(0.)),
              fbm(q + vec2(0.)));
    return fbm(p + 1.*r);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 p = (gl_FragCoord.xy / resolution.xy)*50.;
    ltime = time;
    float ctime = time + fbm(p/8.)*40.;
    float ftime = fract(ctime/6.);
    ltime = floor(ctime/6.) + (1.-cos(ftime*3.1415)/2.);
    ltime = ltime*6.;
    vec2 q;
    vec2 r;
    float f = pattern(p, q, r);
    vec3 colour = vec3(dot(hsv2rgb(vec3(q.x/10. + ltime/100. + .4, abs(r.y)*3. + .1, r.x + f)), vec3(0.299, 0.587, 0.114)));
    vec4 image = texture2D( src, texCoord );
    vec4 finalColour = vec4(colour, 1.0) + image;
    //vec4 finalColour = image;
    gl_FragColor = finalColour * qt_Opacity;
}
