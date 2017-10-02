import QtQuick 2.8

Item {
    id: container
    //
    //
    //
    ShaderEffectSource {
        id: source
        visible: false
        hideSource: true
        anchors.fill: parent
        //sourceItem: content
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
        //
        //
        //
        /*
        NumberAnimation on imageMix {
            from: 0.
            to: 1.
            duration: 1000 * 10
            easing.type: Easing.InOutQuad
        }
        */
    }
    //
    //
    //
    SequentialAnimation {
        id: fadeAnimation
        NumberAnimation {
            target: effect
            properties: "imageMix,opacity"
            from: 0.
            to: 1.
            duration: 1000 * 10
            easing.type: Easing.InOutQuad
        }
        PauseAnimation {
            duration: 1000 * 5
        }
        NumberAnimation {
            target: effect
            properties: "imageMix,opacity"
            from: 1.
            to: .15
            duration: 1000 * (5.*.85)
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
            from: .15
            to: 0.
            duration: 1000 * (5.*.15)
            easing.type: Easing.InOutQuad;
        }
        ScriptAction {
            script: {
                container.destroy();
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
            console.log('Mash : starting fadeAnimation');
            fadeAnimation.start();
        }
    }

    Timer {
        id: lifeTimer
        interval: 1000 * 20
        onTriggered: {
            container.destroy();
        }
    }
    Component.onCompleted: {
        console.log('Mash : starting fadeTimer');
        fadeTimer.start();
    }
    //
    //
    //
    property alias sourceItem: source.sourceItem
    property alias shader: effect.fragmentShader
}
