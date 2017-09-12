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

uniform float amplitude;
uniform float frequency;
float random (in vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))
                 * 43758.5453123);
}

void main() {
        vec4 image = texture2D(src, texCoord);
        float t = time * 5.25;
        //float a = amplitude * imageMix;
        // colour offset glitch
        vec3 val;
        val.r = texture2D(src, texCoord + random(vec2(amplitude / resolution.x, 0.0))).r;
        val.g = texture2D(src, texCoord + random(vec2(amplitude*sin(t) / resolution.x, 0.0))).g;
        val.b = texture2D(src, texCoord + random(vec2(-amplitude*cos(t) / resolution.x, 0.0))).b;

        // the scanline
        val.rgb *= 0.8 + 0.2 * sin(frequency * gl_FragCoord.y + t);

        gl_FragColor = vec4(mix(val,image.rgb,imageMix), image.a * qt_Opacity * imageMix );
}
