import QtQuick 2.8
//
//
//
Item {
    /*
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
        property variant baseColour: appWindow.backgroundColour
        //
        //
        //
        onStatusChanged: {
            if ( status === ShaderEffect.Error ) {
                console.log( 'GLSL error log:\n' + log );
            }
        }
    }
    */
    Image {
        id: noise
        width: 512
        height: 512
        source: "image://noise/background"
    }
    ShaderEffectSource {
        id: noiseSource
        sourceItem: noise
        hideSource: true;
        wrapMode: ShaderEffectSource.Repeat
    }
    //
    //
    //
    ShaderEffect {
        id: effect
        anchors.fill: parent
        vertexShader: "qrc:shaders/passthrough.vert"
        fragmentShader: "qrc:shaders/optimised-caustics.frag" //"qrc:shaders/underwatercaustics-offset.frag"
        visible: true
        property variant noiseTexture: noiseSource
        property variant src: source
        property real time: appWindow.globalTime
        property variant resolution: Qt.size(appWindow.width, appWindow.height)
        property variant surfaceSize: Qt.size(width, height)
        property variant mouse: Qt.point(.5,.5)
        property variant offsetX: x
        property variant offsetY: y
        property variant imageMix: 0.5
        property variant amplitude: appWindow.width / 16.
        property variant frequency: 60.
        property variant baseColour: appWindow.effectColour
        property variant noiseTextureSize: Qt.size(noise.width, noise.height)
        //
        //
        //
        onStatusChanged: {
            if ( status === ShaderEffect.Error ) {
                console.log( 'Mash : GLSL error log:\n' + log );
            }
        }
    }
    //
    //
    //
    property alias mouse: effect.mouse
    property alias shader: effect.fragmentShader
    property alias source: effect.src
}
