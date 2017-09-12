import QtQuick 2.8

Item {
    id: container
    anchors.left: parent.left
    anchors.right: parent.right
    anchors.bottom: parent.bottom
    anchors.margins: 16
    height: content.contentHeight + 64
    z: 2
    //
    //
    //
    Text {
        id: content
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        height: contentHeight + 64
        visible: false
        font.pixelSize: 32
        color: "red"
        wrapMode: Text.WordWrap
        padding: 32
        horizontalAlignment: Text.AlignLeft
        verticalAlignment: Text.AlignBottom
    }
    //
    //
    //
    ShaderEffectSource {
        id: source
        visible: false
        anchors.fill: parent
        sourceItem: content
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
            to: 0.
            duration: 1000 * 5
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
        fadeTimer.start();
    }
    property alias text: content.text
    property alias shader: effect.fragmentShader
}
