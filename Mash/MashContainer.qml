import QtQuick 2.8

Item {
    id: container
    //
    // mash instance caches
    //
    Repeater {
        id: images
        anchors.fill: parent
        model: 12
        ImageMash {
            visible: false
        }
    }
    Repeater {
        id: texts
        anchors.fill: parent
        model: 12
        TextMash {
            visible: false
        }
    }
    //
    //
    //
    function instanciateMash( type, properties ) {
        var instance = findFreeMash( type === "image" ? images : texts );
        if ( instance ) {
            instance.x = properties.x;
            instance.y = properties.y;
            instance.width = properties.width;
            instance.height = properties.height;
            for ( var key in properties ) {
                instance[ key ] = properties[ key ];
            }
            //
            // force text to start, image starts on load
            //
            if ( type === "text" ) {
                instance.start();
            }
        }
        return instance;
    }

    function findFreeMash( repeater ) {
        for ( var i = 0; i < repeater.count; ++i ) {
            if ( repeater.itemAt(i).visible === false ) {
                return repeater.itemAt(i);
            }
        }
        return undefined;
    }
}
