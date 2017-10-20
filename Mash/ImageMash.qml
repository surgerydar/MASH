import QtQuick 2.8

Mash {
    id: container
    visible: content.status === Image.Ready
    //
    //
    //
    Image {
        id: content
        anchors.fill: parent
        fillMode: Image.PreserveAspectFit
        sourceSize: Qt.size(width,height)
        //
        //
        //
        Component.onCompleted: {
            container.sourceItem = content;
        }
    }
    //
    //
    //
    property alias source: content.source
}
