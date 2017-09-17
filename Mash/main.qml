import QtQuick 2.8
import QtQuick.Controls 2.0
import QtQuick.Layouts 1.0
import QtQuick.Window 2.2

import SodaControls 1.0

ApplicationWindow {
    id: appWindow
    visible: true
    width: 640
    height: 480
    title: qsTr("MASH")
    Item {
        id: root
        anchors.fill: parent
        //
        //
        //
        Rectangle {
            id: background
            anchors.fill: parent
            color: "black"
        }
        //
        //
        //
        Background {
            id: dynamicBackground
            anchors.fill: parent
        }
        //
        //
        //
        Text {
            id: status
            anchors.top: parent.top
            anchors.left: parent.left
            color: "white"
        }
        //
        //
        //
        MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            onPositionChanged: {
                dynamicBackground.mouse.x = mouseX;
                dynamicBackground.mouse.y = mouseY;
            }
        }

    }

    //
    //
    //
    Component {
        id: imageComponent

        ImageMash {

        }
    }
    Component {
        id: textComponent

        TextMash {

        }
    }
    //
    //
    //
    NumberAnimation on globalTime { loops: Animation.Infinite; from: 0.; to: 1000.; duration: 500000 }
    //
    //
    //
    Component.onCompleted: {
        Database.load();
        mashTimer.start();
        imageTimer.start();
        textTimer.start();
        webSocketChannel.open();
    }
    Component.onDestruction: {
        Database.save();
    }

    //
    //
    //
    Connections {
        target: DatabaseConnector
        //
        //
        //
        onSuccess: {
            console.log( 'database success : ' + operation + ' : ' + Database.Find );
            switch(operation) {
            case AsyncDatabase.Find ://Database.Find:
                console.log( 'Database.Find : found ' + result.length );
                if( result.length > 0 ) {
                    var mash = result[ 0 ];
                    instanciateMash(mash);
                    Database.update({"_id":mash["_id"]},{"views":++mash.views});
                }
                break;
            case AsyncDatabase.Load :
            case AsyncDatabase.Save :
                break;
            default:
                //Database.save();
            }

        }
        onError: {
            console.log('database operation : ' + operation + ' : error : ' + error );
        }
    }
    function instanciateMash( mash ) {
        //
        // load mash
        //
        switch( mash.type ) {
        case "text" :
            console.log( 'creating text instance' );
            textComponent.createObject(root,{"text":mash.content, "shader": shaders[ currentShader ].mash});
            break;
        case "image" :
            console.log( 'creating imagex instance' );
            imageComponent.createObject(root,{"width": appWindow.width / 2., "height": appWindow.height / 2., "source":mash.content, "shader": shaders[ currentShader ].mash});
            break;
        }
    }
    //
    //
    //
    WebChannel {
        id: mashChannel
        url: "http://mash.soda.co.uk"
        //
        //
        //
        onSuccess: {
            if ( result.length > 0 ) {
                //
                // update database
                //
                console.log( 'WebChannel : adding ' + result.length + ' entries' );
                Database.addMany(result);
            }
        }
        //
        ///
        //
        function update() {
            get( "mash", [ JSON.stringify(Math.round(Database.latest))] );
        }
    }
    //
    //
    //
    WebSocketChannel {
        id: webSocketChannel
        url: "http://mash.soda.co.uk"
        autoreconnect: true
        //
        //
        //
        onOpened : {
            console.log('WebSocketChannel : opened');
        }
        onClosed : {
            console.log('WebSocketChannel : closed');
        }
        onReceived: {
            console.log('WebSocketChannel : received : ' + JSON.stringify(message) );
        }
    }
    Timer {
        id: mashTimer
        //
        //
        //
        interval: 1000*30
        repeat: true
        //
        //
        //
        onTriggered: {
            mashChannel.update();
        }
    }
    //
    //
    //
    Timer {
        id: imageTimer
        //
        //
        //
        interval: 1000*9
        repeat: true
        onTriggered: {
            Database.find({"type":"image"},{"views":1},1);
        }
    }
    //
    //
    //
    Timer {
        id: textTimer
        //
        //
        //
        interval: 1000*16
        repeat: true
        onTriggered: {
            Database.find({"type":"text"},{"views":1},1);
        }
    }

    function setShader( index ) {
        if ( index >= shaders.length ) index = 0;
        if ( index < 0 ) index = shaders.length - 1;
        dynamicBackground.shader = shaders[ index ].background;
        currentShader = index;
        //
        // TODO: set mash shader
        //
    }

    Shortcut {
        sequence: "Ctrl+F"
        onActivated: {
            appWindow.visibility = appWindow.visibility === Window.FullScreen ? Window.Windowed : Window.FullScreen;
        }
    }
    Shortcut {
        sequence: StandardKey.MoveToNextChar
        onActivated: {
            setShader( currentShader + 1 );
        }
    }
    Shortcut {
        sequence: StandardKey.MoveToPreviousChar
        onActivated: {
            setShader( currentShader - 1 );
        }
    }

    //
    //
    //
    property variant shaders: [
        { background: "qrc:shaders/underwatercaustics.frag", mash: "qrc:shaders/underwatercaustics-offset.frag" },
        { background: "qrc:shaders/lines.frag", mash: "qrc:shaders/glitch.frag" },
        { background: "qrc:shaders/balls.frag", mash: "qrc:shaders/glitch.frag" },
        { background: "qrc:shaders/hoop.frag", mash: "qrc:shaders/glitch.frag" },
        { background: "qrc:shaders/fuzzy.frag", mash: "qrc:shaders/fuzzy-offset.frag" },
        { background: "qrc:shaders/clouds.frag", mash: "qrc:shaders/clouds-offset.frag" },
        { background: "qrc:shaders/colourflow.frag", mash: "qrc:shaders/colourflow-offset.frag" },
        { background: "qrc:shaders/grayflow.frag", mash: "qrc:shaders/grayflow-offset.frag" },
        { background: "qrc:shaders/dynamicflow.frag", mash: "qrc:shaders/dynamicflow-offset.frag" }
    ]
    property int currentShader: 0
    property real globalTime: 0
 }
