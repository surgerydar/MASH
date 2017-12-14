uniform highp mat4      qt_Matrix;
attribute highp vec4    qt_Vertex;
attribute highp vec2    qt_MultiTexCoord0;

varying highp vec2 texCoord;
varying vec2 surfacePosition;

void main() {
    texCoord = qt_MultiTexCoord0;
    surfacePosition = qt_Vertex.xy;
    gl_Position = qt_Matrix * qt_Vertex;
}
