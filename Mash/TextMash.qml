import QtQuick 2.8

Mash {
    id: container
    //
    //
    //
    Text {
        id: content
        anchors.fill: parent
        anchors.margins: 8
        visible: false
        fontSizeMode: Text.Fit
        minimumPointSize: 12
        font.pointSize: 64
        elide: Text.ElideRight
        color: "red"
        wrapMode: Text.WordWrap
        padding: 32
        horizontalAlignment: Text.AlignLeft
        verticalAlignment: Text.AlignVCenter
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
    property alias text: content.text
}
