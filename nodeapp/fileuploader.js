'use strict';
let fs = require('fs');
let env = process.env;
let uploads = [];
//
//
//
function FileUploader( guid, filename, fileSize ) {
    this.guid = guid;
    this.fileSize = fileSize;
    this.file = fs.createWriteStream('./upload/' + filename);
}
FileUploader.prototype.writeChunk = function( data ) {
    if ( this.file ) {
        this.file.write( data );
    } else {
        return true;
    }
    this.fileSize -= data.length;
    //console.log( this.fileSize + ' bytes remaining' );
    if ( this.fileSize <= 0 ) {
        console.log( 'closing file');
        this.file.end();
        return true;
    }
    return false;
}
//
//
//
module.exports = (wss,ws,message) => {
    //
    // get block selector
    //
    //console.log( 'message length: ' + message.length );
    let guidLength = message[ 4 ];
    let guid = message.toString('ascii',5,5+guidLength);
    //console.log( 'guid length : ' + guidLength + ' guid : ' + guid);
    let block = message.slice(5+guidLength);
    //console.log( 'block length : ' + block.length);
    let subselector = block.toString('ascii',0,4);
    switch( subselector ) {
        case 'head' :
            let filenameLength = block[ 4 ];
            console.log( 'filenameLength : ' + filenameLength);
            let filename = block.toString('ascii',5,5+filenameLength);
            console.log( 'filename : ' + filename);
            let fileSize = block.readUInt32BE(5+filenameLength);
            console.log( 'guid : ' + guid + ' filename: ' + filename + ' size: ' + fileSize );
            uploads.push(new FileUploader(guid, filename, fileSize));
            break;
        case 'chnk' : 
            for ( var i = 0; i < uploads.length; i++ ) {
                if ( uploads[ i ].guid === guid ) {
                    let data = block.slice(4);
                    //console.log('writing chunk ' + data.length + ' bytes');
                    if ( uploads[ i ].writeChunk( data ) ) {
                        uploads.splice(i,1);
                    }
                    break;
                }
            }
            break;
        default :
            console.log( 'unknown selector : ' + subselector );
    }
}
