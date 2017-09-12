import QtQuick 2.8
//
//
//
Item {
    ShaderEffect {
        id: effect
        anchors.fill: parent
        vertexShader: "qrc:shaders/passthrough.vert"
        //fragmentShader: "qrc:shaders/composite.frag"
        fragmentShader: "qrc:shaders/underwatercaustics.frag"
        //
        //
        //
        property real time: globalTime
        //property variant resolution: Qt.size(1., 1.)
        property variant resolution: Qt.size(width, height)
        property variant surfaceSize: Qt.size(width, height)
        property variant mouse: Qt.point(width/2.,height/2.)
        //
        //
        //
        onStatusChanged: {
            console.log( 'GLSL log:\n' + log );
        }
    }
    //
    //
    //
    property alias mouse: effect.mouse
    property alias shader: effect.fragmentShader
}
