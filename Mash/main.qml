import QtQuick 2.8
import QtQuick.Controls 2.0
import QtQuick.Layouts 1.0
import QtQuick.Window 2.2

import SodaControls 1.0
import "Layout.js" as Layout
import "utils.js" as Utils

ApplicationWindow {
    id: appWindow
    visible: true
    width: 1000
    height: 500
    title: qsTr("MASH")

    Item {
        id: root
        anchors.fill: parent
        //
        //
        //
        /*
        Rectangle {
            //id: background
            anchors.fill: parent
            color: "black"
        }
        */
        //
        //
        //
        CompositeImage {
            id: background
            anchors.fill: parent
        }
        ShaderEffectSource {
            id: backgroundSource
            anchors.fill: parent
            sourceItem: background
            hideSource: true
            visible: false
        }
        //
        //
        //
        Background {
            id: dynamicBackground
            //visible: false
            anchors.fill: parent
            shader: shaders[ currentShader ].background
            source: backgroundSource
        }
        Item {
            id: mashContainer
            anchors.fill: parent
        }
        //
        //
        //
        Banner {
            id: banner
            anchors.left: parent.left
            anchors.bottom: parent.bottom
            anchors.right: parent.right
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
    RegisterDialog {
        id: firstRun
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
    NumberAnimation on globalTime {
        id: globalTimer
        loops: Animation.Infinite
        from: 0.
        to: 10000.
        duration: 5000000
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
            case AsyncDatabase.Find :
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
        var bounds = Layout.getRectangle();
        if ( bounds === undefined ) {
            Layout.setup({x:0.,y:0.,width:width,height:height});
            bounds = Layout.getRectangle();
        }

        if ( mash.content && mash.content.length > 0 ) {
            //
            // trim spaces
            //
            mash.content = mash.content.trim();
            //
            // random offset
            //
            /*
            bounds.x += ( .5 - Math.random() ) * 15;
            bounds.y += ( .5 - Math.random() ) * 15;
            bounds.width = Math.min( bounds.width, width - bounds.x );
            bounds.height = Math.min( bounds.height, height - bounds.y );
            */
            switch( mash.type ) {
            case "text" :
                console.log( 'creating text instance at : ' + JSON.stringify(bounds) );
                //
                // extend to fill width
                //
                bounds.width = width - bounds.x;
                //
                // convert entities for display
                //
                mash.content = Utils.decodeHTMLEntities(mash.content);
                //
                //
                //
                //var hAlign = Math.random() > .5 ? Text.AlignLeft : Text.AlignRight;
                var hAlign = Text.AlignLeft;
                var vAlign = Math.random() > .5 ? Text.AlignTop : Text.AlignBottom;
                textComponent.createObject(mashContainer,{ "x":bounds.x, "y":bounds.y, "width": bounds.width, "height": bounds.height, "text":mash.content, "colour": textColour, "shader": shaders[ currentShader ].mash, "hAlign": hAlign, "vAlign": vAlign});
                break;
            case "image" :
                console.log( 'creating image instance at : ' + JSON.stringify(bounds) );
                //
                // redirect dropbox through mash proxy
                //
                mash.content = mash.content.replace('https://dl.dropboxusercontent.com:443','http://mash.soda.co.uk');
                imageComponent.createObject(mashContainer,{ "x":bounds.x, "y":bounds.y, "width": bounds.width, "height": bounds.height, "source":"image://cached/" + mash.content.trim(), "shader": shaders[ currentShader ].mash});
                break;
            }
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
                //Database.addMany(result);
                Database.sync(result);
            }
        }
        //
        //
        //
        function update() {
            //get( "mash", [ JSON.stringify(Math.round(Database.latest))] );
            get( "mash", [ "0" ] );
        }
    }
    //
    //
    //
    WebSocketChannel {
        id: webSocketChannel
        url: "ws://mash.soda.co.uk"
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
            console.log('WebSocketChannel : received : ' + message );
            var guid;
            var command = JSON.parse(message);
            switch( command.command.toLowerCase() ) {
            case 'welcome' :
                if ( instance !== "" && account !== "" ) {
                    connectDisplay();
                }
                break;
            case 'registerdisplay' :
                if ( command.status === "OK" ) {
                    Settings.set( "account", command.account );
                    Settings.save();
                    connectDisplay();
                    firstRun.close();
                } else {
                    firstRun.errorText = "ERROR: " + command.response;
                }

                break;
            case 'connectdisplay' :
                if ( command.status === "ERROR" ) {
                    //
                    //
                    //
                    console.log( "ERROR connecting display : " + command.error );
                } else {
                    if ( command.configuration ) {
                        setConfiguration(command.configuration);
                    }
                }
                break;
            case 'updatedisplayconfiguration' :
                setConfiguration(command.configuration);
                break;
            case 'text' :
                //instanciateMash( {type:"text", content:command.content} );
                banner.setText(command.content);
                break;
            case 'image' :
                instanciateMash( {type:"image", content:command.content} );
                break;
            case 'nexteffect' :
                setShader( currentShader + 1 );
                break;
            case 'previouseffect' :
                setShader( currentShader - 1 );
                break;
            case 'effect' :
                setShader( parseInt(command.number) );
                break;
            case 'textcolour' :
                textColour = command.colour;
                break;
            case 'effectcolour' :
                effectColour = command.colour;
                break;
            case 'textsource' :
                textSource = command.source;
                break;
            case 'imagesource' :
                imageSource = command.source;
                break;
            case 'configuration' :
                send( { command: 'configuration',
                         configuration: getConfiguration()
                     });
            }

        }
    }
    /*
      configuration
      */
    function getConfiguration() {
        return {
            name: name,
            effect: currentShader,
            textColour: textColour,
            effectColour: effectColour,
            globalSpeed: globalSpeed,
            effectSpeed: effectSpeed,
            tags: tags,
            textSource: textSource,
            imageSource: imageSource
        };
    }
    function setConfiguration( configuration ) {
        name = configuration.name || name;
        //nextShader = currentShader = configuration.effect || currentShader;
        nextShader = configuration.effect !== undefined ? configuration.effect : currentShader;
        if ( configuration.textColour ) {
            if ( typeof configuration.textColour === "string" ) {
                textColour = configuration.textColour;
            } else {
                textColour = Qt.rgba(
                            configuration.textColour["r"] || 1,
                            configuration.textColour["g"] || 0,
                            configuration.textColour["b"] || 0,
                            configuration.textColour["a"] || 1);
            }
        }
        if ( configuration.effectColour ) {
            if ( typeof configuration.effectColour === "string" ) {
                effectColour = configuration.effectColour;
            } else {
                effectColour = Qt.rgba(
                            configuration.effectColour["r"] || 0,
                            configuration.effectColour["g"] || 0,
                            configuration.effectColour["b"] || 0,
                            configuration.effectColour["a"] || 1);
            }
        }
        globalSpeed = configuration.globalSpeed || globalSpeed;
        effectSpeed = configuration.effectSpeed || effectSpeed;
        tags = configuration.tags || tags;
        textSource = configuration.textSource || textSource;
        imageSource = configuration.imageSource || imageSource;
        //
        //
        //
        var duration = Math.round(5000000*(1./effectSpeed));
        if ( duration !== globalTimer.duration ) {
            console.log( 'reseting global timer' );
            globalTimer.duration = duration;
            globalTimer.restart();
        }
    }
    //
    //
    //
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
        interval: Math.round(1000*9* ( 1. / globalSpeed ) )
        repeat: true
        onTriggered: {
            var query;
            if ( imageSource.length > 0 ) {
                query = {"type":"image","source":imageSource};
                Database.find(query,{"views":1},1);
            } else {
                query = {"type":"image"};
                Database.find({"type":"image"},{"views":1},1);
            }
            console.log( 'query' + JSON.stringify(query) );

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
        interval: Math.round(1000*16* ( 1. / globalSpeed ) )
        repeat: true
        onTriggered: {
            if ( textSource.length > 0 ) {
                Database.find({"type":"text","source":textSource},{"views":1},1);
            } else {
                Database.find({"type":"text"},{"views":1},1);
            }
        }
    }
    //
    //
    //
    function setShader( index ) {
        if ( Number.NaN === index ) return; // invalid number may come from 'direct' control
        if ( index >= shaders.length ) index = 0;
        if ( index < 0 ) index = shaders.length - 1;
        currentShader = index;
        dynamicBackground.shader = shaders[ index ].background;
        //
        // TODO: set live mash shader
        //
        /*
        for ( var i = 0; i < mashContainer.children.length; ++i ) {
            var child = mashContainer.children[i];
            if ( child.shader !== undefined ) {
                child.shader = shaders[ index ].mash;
            }
        }
        */
    }
    //
    //
    //
    function registerDisplay( accountKey ) {
        webSocketChannel.send( { command: 'registerdisplay', display: instance, account: accountKey, configuration: getConfiguration() } );
    }

    function connectDisplay() {
        if ( instance !== "" && account !== "" ) {
            webSocketChannel.send( { command: 'connectdisplay', display: instance, account: account } );
        }
    }
    function disconnectDisplay() {
        if ( instance !== "" && account !== "" ) {
            webSocketChannel.send( { command: 'disconnectdisplay', display: instance, account: account } );
        }
    }

    //
    //
    //
    Shortcut {
        sequence: "Ctrl+X"
        onActivated: {
            Qt.exit(0);
        }
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
            //setShader( currentShader + 1 );
            nextShader = currentShader + 1;
        }
    }
    Shortcut {
        sequence: StandardKey.MoveToPreviousChar
        onActivated: {
            //setShader( currentShader - 1 );
            nextShader = currentShader - 1;
        }
    }
    //
    //
    //
    onWidthChanged: {
        Layout.setup({x:0.,y:0.,width:width,height:height});
    }
    onBeforeSynchronizing: {
        if ( currentShader !== nextShader ) {
            setShader(nextShader);
        }
    }
    //
    //
    //
    Component.onCompleted: {

        //
        // Load settings
        //
        Settings.load();
        instance = Settings.get("instance");
        account = Settings.get("account");
        if ( account === "" || instance === "" ) {
            if ( instance === "" ) {
                instance = GUIDGenerator.generate();
                Settings.set("instance",instance);
                Settings.save();
            }
            firstRun.open();
        }
        var configuration = Settings.get("configuration");
        if ( configuration !== "" ) {
            try {
                setConfiguration(JSON.parse(configuration));
            } catch( error ) {
                console.log( 'error restoring configuration : ' + error );
            }
        } else {
            Settings.set("configuration", JSON.stringify(getConfiguration()));
            Settings.save();
        }
        //
        // Load database
        //
        Database.load();
        //
        //
        //
        background.load();
        background.start();
        //
        // Start animation
        //
        mashTimer.start();
        imageTimer.start();
        textTimer.start();
        //
        // Open communications with the server
        //
        webSocketChannel.open();
        //
        // Initialise layout
        //
        Layout.setup({x:0.,y:0.,width:appWindow.width,height:appWindow.height});
        //
        // Go fullscreen
        //
        appWindow.showFullScreen();
    }
    //
    //
    //
    Component.onDestruction: {
        //
        //
        //
        disconnectDisplay();
        //
        //
        //
        background.stop();
        background.save();
        //
        //
        //
        Database.save();
        //
        //
        //
        Settings.set("configuration", JSON.stringify(getConfiguration()));
        Settings.save();
    }
    //
    //
    //
    //
    //
    //
    property variant shaders: [
        { background: "qrc:shaders/underwatercaustics.frag", mash: "qrc:shaders/underwatercaustics-offset.frag" },
        { background: "qrc:shaders/dynamicflow.frag", mash: "qrc:shaders/dynamicflow-offset.frag" },
        { background: "qrc:shaders/oiley.frag", mash: "qrc:shaders/oiley-offset.frag" },
        { background: "qrc:shaders/optimised-caustics.frag", mash: "qrc:shaders/grayflow-offset.frag" },
        { background: "qrc:shaders/verticalbars.frag", mash: "qrc:shaders/verticalbars-offset.frag" },
        { background: "qrc:shaders/horizontalbars.frag", mash: "qrc:shaders/horizontalbars-offset.frag" }
    ]
    property real globalTime: 0
    property alias cumulative: background
    /*
      configuration
      */
    property int currentShader: 6//4
    property int nextShader: 6
    property color textColour: "red"
    property color effectColour: "white"
    property real globalSpeed: 1.
    property real effectSpeed: 1.
    property string imageSource: ""
    property string textSource: ""
    property string tags: ""
    property string name: "Unnamed"
    property string instance: ""
    property string account: ""
 }
