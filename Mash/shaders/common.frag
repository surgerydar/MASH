#ifdef GL_ES
precision mediump float;
#endif

/*
  input
  */
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform float globalScale;
uniform float globalRotation;

uniform sampler2D src;
varying vec2 texCoord;
uniform float imageMix;
uniform vec4 baseColour;

uniform float qt_Opacity;

uniform sampler2D noiseTexture;
uniform vec2 noiseTextureSize;

/*
  constants
  */
const float _pi = 3.14159;

/*
  common functions
  */
float noise( in vec2 x ) {
    //return texture2D(noiseTexture, (x/noiseTextureSize)).x;
    return texture2D(noiseTexture, x * .01).x;
}

mat2 rotationmatrix(in float rotation) {
    float c = cos(rotation);
    float s = sin(rotation);
    return mat2(c,-s,s,c);
}

float fbm(in vec2 p, in float octaves, in float lacunarity, in float gain, in float rotation ) {
    //
    // initial values
    //
    float amplitude = 0.5;
    float frequency = 1.;
    mat2 transform = rotationmatrix(rotation);
    //
    // loop of octaves
    //
    float y = 0.;
    for (int i = 0; i < octaves; i++) {
            y += amplitude * noise(frequency*p);
            frequency *= lacunarity;
            amplitude *= gain;
            p *= transform;
    }
    return y;
}

vec2 globalposition( in vec2 p, in float scale, in float rotation ) {
    mat2 transform = rotationmatrix(rotation);
    p *= transform;
    return ( p * scale ) / min(resolution.x, resolution.y);
}
