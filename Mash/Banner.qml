import QtQuick 2.8

Item {
    id: container
    height: 128
    z: 4
    opacity: content.text.length > 0 ? 1. : 0.

    Rectangle {
        anchors.fill: parent
        color: "red"
    }

    Text {
        id: content
        x: container.width
        anchors.verticalCenter: parent.verticalCenter
        wrapMode: Text.NoWrap
        color: "white"
        font.pointSize: 64
    }

    NumberAnimation {
        id: bannerAnimation
        target: content
        property: "x"
        duration: 6000 * Math.max( 1 , ( content.contentWidth / 640. ) )
        from: container.width
        to: -content.contentWidth
        onStopped: {
            content.text = "";
        }
    }

    Behavior on opacity {
        NumberAnimation { duration: 200 }
    }

    function setText( text ) {
        if ( text.length > 0 ) {
            content.x = container.width
            content.text = text
            bannerAnimation.start();
        } else {
            bannerAnimation.stop();
        }
    }
}
