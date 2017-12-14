import QtQuick 2.8
import QtQuick.Controls 2.0

Rectangle {
    id: container
    width: 800
    height: 300
    color: "lightgray"
    anchors.horizontalCenter: parent.horizontalCenter
    anchors.top: parent.top
    //
    //
    //
    Column {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 16
        //
        //
        //
        Text {
           text: "account number"
           anchors.left: parent.left
           anchors.right: parent.right
           horizontalAlignment: TextField.AlignHCenter
           font.pointSize: 32
           font.weight: Font.Bold
        }
        //
        //
        //
        TextField {
            id: accountNumberField
            anchors.left: parent.left
            anchors.right: parent.right
            horizontalAlignment: TextField.AlignHCenter
            placeholderText: "account number"
            // {ff515449-5187-4fbf-8c26-b3e08df4b963}
            inputMask: ">HHHHHHHH-HHHH-HHHH-HHHH-HHHHHHHHHHHH"
            font.pointSize: 32
            font.weight: Font.Bold
            focus: false
        }
        //
        //
        //
        Button {
            id: ok
            anchors.horizontalCenter: parent.horizontalCenter
            text: "OK"
            onClicked: {
                if( accountNumberField.acceptableInput ) {
                    //
                    // TODO: validate with server
                    //
                    firstRun.errorText = "";
                    appWindow.registerDisplay("{" + accountNumberField.text.toLowerCase() + "}");
                } else {
                    error.text = "invalid account number"
                }
            }
        }
        //
        //
        //
        Text {
            id: error
            anchors.left: parent.left
            anchors.right: parent.right
            horizontalAlignment: TextField.AlignHCenter
            font.pointSize: 32
            font.weight: Font.Bold
        }
    }
    //
    //
    //
    state: "closed"
    states: [
        State {
            name: "closed"
            PropertyChanges {
                target: container
                anchors.topMargin: -height
            }
        },
        State {
            name: "open"
            PropertyChanges {
                target: container
                anchors.topMargin: 0
            }
        }
    ]
    transitions: Transition {
        NumberAnimation {
            properties: "anchors.topMargin"
            easing.type: Easing.InOutQuad
            duration: 500
        }
    }
    //
    //
    //
    function open() {
        state = "open";
        accountNumberField.focus = true;
    }
    function close() {
        appWindow.requestActivate();
        state = "closed";
        accountNumberField.focus = false;

    }
    //
    //
    //
    property alias errorText: error.text
}
