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
    var series = [0];
    var direction = 'down';
    var dim = bounds.height / 5.;
    var x = bounds.x;
    var y = bounds.y;
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
        if ( direction === 'down' ) {
            x = bounds.x;
            y = rectangle.y + rectangle.height;
            direction = 'right';
        } else if( direction === 'right' ){
            x = rectangle.x + rectangle.width;
            y = bounds.y;
            direction = 'down';
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
