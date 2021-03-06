import QtQuick 2.8
import QtQuick.Controls 2.0
import QtQuick.Layouts 1.0
import QtQuick.Window 2.2

import SodaControls 1.0
import "Layout.js" as Layout
import "utils.js" as Utils

Window {
    id: appWindow
    objectName: "appWindow"
    visible: true
    //visibility: Window.FullScreen
    width: Screen.width
    height: Screen.height
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
        //
        //
        //
        /*
        Item {
            id: mashContainer
            anchors.fill: parent
        }
        */
        MashContainer {
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
            //console.log( 'database success : ' + operation );
            switch(operation) {
            case AsyncDatabase.Find :
                console.log( 'Database.Find : found ' + result.length );
                if( result.length > 0 ) {
                    //
                    // bias towards active tags
                    //
                    var maxScore = -1;
                    var maxIndex = 0;
                    for ( var i = 0; i < result.length; ++i ) {
                        if ( result[ i ].tags ) {
                            var score = containsActiveTags(result[i].tags);
                            if ( score > maxScore ) {
                                maxScore = score;
                                maxIndex = i;
                            }
                        }
                    }
                    //
                    // instanciate
                    //
                    var mash = result[ maxIndex ];
                    instanciateMash(mash);
                    Database.update({"_id":mash["_id"]},{"views":++mash.views});
                }
                break;
            case AsyncDatabase.Load :
                console.log( 'Database.Load' );
                break;
            case AsyncDatabase.Save :
                console.log( 'Database.Save' );
                break;
            case AsyncDatabase.Update :
                Database.save();
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
        //console.log( 'Instanciating mash : ' + JSON.stringify(mash) );
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
            // instanciate mash
            //


            switch( mash.type ) {
            case "text" :
                //console.log( 'creating text instance at : ' + JSON.stringify(bounds) );
                //
                // extend to fill width
                //
                bounds.width = width - bounds.x;
                //
                // convert entities for display
                //
                mash.content = Utils.decodeHTMLEntities(mash.content);
                //
                // extract links
                //
                var regexp = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@\/?]*)?)(\s+|$)/gi;
                var links = mash.content.match(regexp) || [];
                //
                //
                //
                //var hAlign = Math.random() > .5 ? Text.AlignLeft : Text.AlignRight;
                var hAlign = Text.AlignLeft;
                var vAlign = Math.random() > .5 ? Text.AlignTop : Text.AlignBottom;
                //textComponent.createObject(mashContainer,{ "x":bounds.x, "y":bounds.y, "width": bounds.width, "height": bounds.height, "text":mash.content, "colour": textColour, "shader": shaders[ currentShader ].mash, "hAlign": hAlign, "vAlign": vAlign});
                mashContainer.instanciateMash("text",{ "x":bounds.x, "y":bounds.y, "width": bounds.width, "height": bounds.height, "text":mash.content, "colour": textColour, "shader": shaders[ currentShader ].mash, "hAlign": hAlign, "vAlign": vAlign, "tags": mash.tags, "links": links });
                break;
            case "image" :
                //console.log( 'creating image instance at : ' + JSON.stringify(bounds) );
                //
                // redirect dropbox through mash proxy
                //
                mash.content = mash.content.replace('https://dl.dropboxusercontent.com:443','http://mash.soda.co.uk');
                //imageComponent.createObject(mashContainer,{ "x":bounds.x, "y":bounds.y, "width": bounds.width, "height": bounds.height, "source":"image://cached/" + mash.content.trim(), "shader": shaders[ currentShader ].mash});
                mashContainer.instanciateMash("image",{ "x":bounds.x, "y":bounds.y, "width": bounds.width, "height": bounds.height, "source":"image://cached/" + mash.content.trim(), "shader": shaders[ currentShader ].mash, "tags" : mash.tags});
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
                //
                //
                //
                gc();
            } else {
                console.log( 'no results from database update')
            }
        }
        onError: {
            console.log( 'error updating database : ' + error );
        }
        //
        //
        //
        function update() {
            //get( "mash", [ JSON.stringify(Math.round(Database.latest))] );
            //get( "mash", [ "0" ] );
            if ( account.length > 0 ) {
                var param = [ account.substring(1,account.length-1) ];
                if ( tags ) {
                    param.push(tags);
                } else {
                    param.push('all');
                }
                get( "mash", param );
            }
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
        onError: {
            console.log('WebSocketChannel : error' );
        }

        onOpened : {
            console.log('WebSocketChannel : opened');
        }
        onClosed : {
            console.log('WebSocketChannel : closed');
        }
        onReceived: {
            //console.log('WebSocketChannel : received : ' + message );
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
                //
                //
                //
                Settings.set("configuration", JSON.stringify(getConfiguration()));
                Settings.save();
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
            imageFrequency: imageFrequency,
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
        imageFrequency = configuration.imageFrequency || imageFrequency;
        var previousTags = tags;
        tags = configuration.tags !== undefined ?  configuration.tags : tags;
        textSource = configuration.textSource || textSource;
        imageSource = configuration.imageSource || imageSource;
        //
        // reset timer
        //
        var duration = Math.round(5000000*(1./effectSpeed));
        if ( duration !== globalTimer.duration ) {
            console.log( 'reseting global timer' );
            globalTimer.duration = duration;
            if ( globalTimer.running ) {
                globalTimer.restart();
            }
        }
        //
        // reset image freqency
        //
        var frequency = Math.round((1000*9* ( 1. / globalSpeed ))* ( 1. / imageFrequency ) );
        if ( frequency !== imageTimer.interval ) {
            imageTimer.interval = frequency;
            if ( imageTimer.running ) {
                imageTimer.restart();
            }
        }

        //
        // if tags have changed request update
        //
        if ( previousTags !== tags ) {
            mashChannel.update();
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
                //Database.find(query,{"views":1},1);
                Database.find(query,{"views":1},10);
            } else {
                query = {"type":"image"};
                //Database.find({"type":"image"},{"views":1},1);
                Database.find({"type":"image"},{"views":1},10);
            }
            //console.log( 'query' + JSON.stringify(query) );
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
                //Database.find({"type":"text","source":textSource},{"views":1},1);
                Database.find({"type":"text","source":textSource},{"views":1},10);
            } else {
                //Database.find({"type":"text"},{"views":1},1);
                Database.find({"type":"text"},{"views":1},10);
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
    }
    //
    //
    //
    Component.onDestruction: {
        //
        //
        //
        disconnectDisplay();
        webSocketChannel.autoreconnect = false;
        //
        //
        //
        imageTimer.stop();
        textTimer.stop();
        mashTimer.stop();
        globalTimer.stop();
        //
        //
        //
        background.stop();
        /*
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
        */
        save();
        //
        //
        //
        webSocketChannel.close();
    }
    //
    //
    //
    function save() {
        console.log( 'saving state' );
        background.save();
        Database.save();
        Settings.set("configuration", JSON.stringify(getConfiguration()));
        Settings.save();
    }
    //
    // active tag handling
    //
    function addActiveTags( tags ) {
        var newTags = tags.slice();
        //
        // update existing
        //
        activeTags.forEach( function( tagEntry ) {
            var index = newTags.indexOf( tagEntry.tag );
            if ( index >= 0 ) {
                newTags.splice( index, 1 );
                tagEntry.count++;
            }
        });
        //
        // add new
        //
        newTags.forEach( function( tag ) {
            activeTags.push({
                                tag : tag,
                                count: 1
                            });
        });
        console.log( 'add : active tags : ' + JSON.stringify(activeTags));
    }
    function removeActiveTags( tags ) {
        //
        // update existing
        //
        for ( var i = 0; i < activeTags.length; ) {
            var index = tags.indexOf( activeTags[ i ].tag );
            if ( index >= 0 ) {
                activeTags[ i ].count--;
                if ( activeTags[ i ].count <= 0 ) {
                    activeTags.splice(i,1);
                    continue;
                }
            }
            i++;
        }
        console.log( 'remove : active tags : ' + JSON.stringify(activeTags));
    }
    function containsActiveTags( tags ) {
        var count = 0;
        activeTags.forEach( function( tagEntry ) {
            var index = tags.indexOf( tagEntry.tag );
            if ( index >= 0 ) {
                count++;
            }
        });
        return count;
    }
    //
    //
    //
    function addActiveLinks( links ) {
        var newLinks = links.slice();
        //
        // update existing
        //
        activeLinks.forEach( function( linkEntry ) {
            var index = newLinks.indexOf( linkEntry.link );
            if ( index >= 0 ) {
                newLinks.splice( index, 1 );
                linkEntry.count++;
            }
        });
        //
        // add new
        //
        newLinks.forEach( function( link ) {
            var linkEntry = {
                link : link,
                count: 1
            };
            linkDisplay.model.append(linkEntry);
            activeLinks.push(linkEntry);
        });
        console.log( 'add : active links : ' + JSON.stringify(activeLinks));
    }
    function removeActiveLinks( links ) {
        //
        // update existing
        //
        for ( var i = 0; i < activeLinks.length; ) {
            var index = links.indexOf( activeLinks[ i ].link );
            if ( index >= 0 ) {
                activeLinks[ i ].count--;
                if ( activeLinks[ i ].count <= 0 ) {
                    linkDisplay.model.remove(i);
                    activeLinks.splice(i,1);
                    continue;
                }
            }
            i++;
        }
        console.log( 'remove : active links : ' + JSON.stringify(activeLinks));
    }
    ListView {
        id: linkDisplay
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.margins: 16
        height: 256
        z: 4
        spacing: 16
        orientation: ListView.Horizontal
        /*
        add: Transition {
            NumberAnimation {
                properties: "y"
                from: linkDisplay.height + 16
                to: linkDisplay.height - height
                duration: 500
            }
        }

        remove: Transition {
            NumberAnimation {
                properties: "y"
                to: linkDisplay.height + 16
                duration: 500
            }
        }

        addDisplaced: Transition {
            NumberAnimation {
                properties: "x"
                duration: 500
            }
        }
        removeDisplaced: Transition {
            NumberAnimation {
                properties: "x"
                duration: 500
            }
        }

        moveDisplaced: Transition {
            NumberAnimation {
                properties: "x"
                duration: 500
            }
        }
        */
        model: ListModel {

        }
        delegate: Image {
            id: qr
            //anchors.bottom: parent.bottom
            source: "image://qr/" + model.link;
            y: linkDisplay.height + 16
            //
            //
            //
            ListView.onAdd: NumberAnimation {
                target: qr;
                property: "y";
                to: linkDisplay.height - qr.height; duration: 500; easing.type: Easing.InOutQuad
            }
            ListView.onRemove : SequentialAnimation {
                PropertyAction { target: qr; property: "ListView.delayRemove"; value: true }
                NumberAnimation { target: qr; property: "y"; to: linkDisplay.height + 16; duration: 500; easing.type: Easing.InOutQuad }
                PropertyAction { target: qr; property: "ListView.delayRemove"; value: false }
            }
            Behavior on x {
                NumberAnimation { duration: 1000; easing.type: Easing.InOutQuad }
            }
        }
    }
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
    //
    // configuration
    //
    property int currentShader: 1
    property int nextShader: 1
    property color textColour: "red"
    property color effectColour: "white"
    property real globalSpeed: 1.
    property real effectSpeed: 1.
    property real imageFrequency: .5
    property string imageSource: ""
    property string textSource: ""
    property string tags: ""
    property string name: "Unnamed"
    property string instance: ""
    property string account: ""
    //
    //
    //
    property int mashCount: 0
    //
    //
    //
    property var activeTags: []
    property var activeLinks: []
 }
