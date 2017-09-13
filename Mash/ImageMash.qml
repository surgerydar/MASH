import QtQuick 2.8

Image {
    id: container
    fillMode: Image.PreserveAspectFit
    y: 0
    x: -width
    //
    //
    //
    ShaderEffect {
        id: effect
        visible: container.status === Image.Ready && fadeAnimation.running
        //x: outputX + container.width
        //y: outputY
        x: container.width + root.x + ( root.width - container.paintedWidth ) / 2. + (( Math.random() - .5 ) * ( root.width - container.paintedWidth / 2. ) )
        y: root.y + ( root.height - container.paintedHeight ) / 2.  + (( Math.random() - .5 ) * ( root.height - container.paintedHeight / 2. ))
        width: container.paintedWidth
        height: container.paintedHeight
        vertexShader: "qrc:shaders/passthrough.vert"
        fragmentShader: "qrc:shaders/underwatercaustics-offset.frag"
        property variant src: container
        property real time: appWindow.globalTime
        property variant resolution: Qt.size(appWindow.width, appWindow.height)
        property variant mouse: Qt.point(.5,.5)
        property variant offsetX: x
        property variant offsetY: y
        property variant imageMix: 0.
        property variant amplitude: appWindow.width / 8.
        property variant frequency: 120.
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
            console.log('ImageMash : starting fadeAnimation');
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
        console.log('ImageMash : starting fadeTimer');
        fadeTimer.start();
    }
    //
    //
    //
    property real outputX: 0.
    property real outputY: 0.
    property alias shader: effect.fragmentShader
}
