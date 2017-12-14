var rectangles = [];
var ratio = 1.618;
var invRatio = 1. / ratio;
//
//
//
function setup( bounds ) {
    //
    // pregenerate divisions
    //
    rectangles = [];
    var pattern = Math.floor( ( Math.random() * 4 ) );
    console.log( 'Layout.setup : pattern : ' + pattern );
    var series = [0];
    var direction;
    var dim = bounds.height / 5.;
    var x, y;
    switch ( pattern ) {
    case 0 :
        x = bounds.x;
        y = bounds.y;
        direction = 'down';
        break;
    case 1 :
        x = bounds.x + bounds.width - dim;
        y = bounds.y;
        direction = 'down';
        break;
    case 2 :
        x = bounds.x + bounds.width - dim;
        y = bounds.y + bounds.height - dim;
        direction = 'up';
        break;
    default :
        x = bounds.x;
        y = bounds.y + bounds.height - dim;
        direction = 'up';
        break;
    }

    for ( var i = 0; i < 5; i++ ) {
        //
        // calculate scale
        //
        var scale = 1.;
        if ( series.length >= 2 ) {
            scale = series[ series.length - 1 ] + series[ series.length - 2 ];
        }
        series.push(scale);
        //
        // generate rectangle
        //
        var scaledDim = dim * scale;
        var rectangle = { x:x, y:y, width:scaledDim, height:scaledDim, occupied: false };
        rectangles.push( rectangle );
        //
        // calculate next origin
        //
        if ( series.length >= 2 ) {
            scale = series[ series.length - 1 ] + series[ series.length - 2 ];
        }
        scaledDim = dim * scale;
        switch( pattern ) {
        case 0:
            if ( direction === 'down' ) {
                x = bounds.x;
                y = rectangle.y + rectangle.height;
                direction = 'right';
            } else if( direction === 'right' ){
                x = rectangle.x + rectangle.width;
                y = bounds.y;
                direction = 'down';
            }
            break;
        case 1:
            if ( direction === 'down' ) {
                x = ( bounds.x + bounds.width ) - scaledDim;
                y = rectangle.y + rectangle.height;
                direction = 'left';
            } else if( direction === 'left' ){
                x = rectangle.x - scaledDim;
                y = bounds.y;
                direction = 'down';
            }
            break;
        case 2:
            if ( direction === 'up' ) {
                x = rectangle.x;
                y = rectangle.y - scaledDim;
                direction = 'left';
            } else if( direction === 'left' ){
                x = rectangle.x - scaledDim;
                y = rectangle.y;
                direction = 'up';
            }
            break;
        default:
            if ( direction === 'up' ) {
                x = bounds.x;
                y = rectangle.y - scaledDim;
                direction = 'right';
            } else if( direction === 'right' ){
                x = rectangle.x + rectangle.width;
                y = rectangle.y;
                direction = 'up';
            }
            break;
        }
    }
}

function getRectangle() {
    for ( var i = 0; i < rectangles.length; i++ ) {
        if ( !rectangles[i].occupied ) {
            rectangles[i].occupied = true;
            return rectangles[i];
        }
    }
    return undefined;
}
