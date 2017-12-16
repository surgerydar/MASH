import QtQuick 2.8

Item {
    id: container
    //
    //
    //
    Image {
        id: noise
        width: 512
        height: 512
        source: "image://noise/background"
        //
        //
        //
        Component.onDestruction: {
            console.log( 'noise destroyed');
        }
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
    ShaderEffectSource {
        id: source
        visible: false
        hideSource: true
        anchors.fill: parent
        //sourceItem: content
        wrapMode: ShaderEffectSource.Repeat
    }
    //
    //
    //
    ShaderEffect {
        id: effect
        anchors.fill: parent
        vertexShader: "qrc:shaders/passthrough.vert"
        fragmentShader: "qrc:shaders/underwatercaustics-offset.frag"
        visible: fadeAnimation.running
        property variant noiseTexture: noiseSource
        property variant src: source
        property real time: appWindow.globalTime
        property variant resolution: Qt.size(appWindow.width, appWindow.height)
        property variant surfaceSize: Qt.size(width, height)
        property variant mouse: Qt.point(.5,.5)
        property variant offsetX: x
        property variant offsetY: y
        property variant imageMix: 0.
        property variant amplitude: appWindow.width / 16.
        property variant frequency: 60.
        property variant baseColour: appWindow.backgroundColour
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
    SequentialAnimation {
        id: fadeAnimation
        NumberAnimation {
            target: effect
            properties: "imageMix,opacity"
            //properties: "imageMix"
            from: 0.
            to: 1.
            duration: Math.round(1000. * 10. * ( 1. / appWindow.globalSpeed ) )
            easing.type: Easing.InOutQuad
        }
        PauseAnimation {
            duration: 1000 * 5
        }
        NumberAnimation {
            target: effect
            properties: "imageMix,opacity"
            //properties: "imageMix"
            from: 1.
            to: .15
            duration: Math.round(1000 * (5.*.85) * ( 1. / appWindow.globalSpeed ) )
            easing.type: Easing.InOutQuad;
        }
        ScriptAction {
            script: {
                appWindow.cumulative.addImage(effect);
            }
        }
        NumberAnimation {
            target: effect
            properties: "imageMix,opacity"
            //properties: "imageMix"
            from: .15
            to: 0.
            duration: Math.round(1000 * (5.*.15) * ( 1. / appWindow.globalSpeed ) )
            easing.type: Easing.InOutQuad;
        }
        ScriptAction {
            script: {
                container.stop();
            }
        }
    }
    //
    //
    //
    Timer {
        id: fadeTimer
        interval: 500
        onTriggered: {
            fadeAnimation.start();
        }
    }
    //
    //
    //
    function start() {
        fadeAnimation.start();
        visible = true;
        if ( tags.length > 0 ) {
            appWindow.addActiveTags(tags);
        }
        if ( links.length > 0 ) {
            appWindow.addActiveLinks(links);
        }
    }
    function stop() {
        //container.destroy();
        container.visible = false;
        if ( tags.length > 0 ) {
            appWindow.removeActiveTags(tags);
        }
        if ( links.length > 0 ) {
            appWindow.removeActiveLinks(links);
            links = [];
        }
    }

    //
    //
    //
    Component.onCompleted: {
        appWindow.mashCount++;
        console.log( 'mash created : count : ' + appWindow.mashCount );
    }
    Component.onDestruction: {
        appWindow.mashCount--;
        console.log( 'mash destroyed : count : ' + appWindow.mashCount );
    }

    //
    //
    //
    property alias sourceItem: source.sourceItem
    property alias shader: effect.fragmentShader
    property alias fadeAnimation: fadeAnimation
    property var tags: []
    property variant links: []
}
