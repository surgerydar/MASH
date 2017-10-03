var _wsr = undefined;
var _db = undefined;

function DisplayControl() {
    
}

DisplayControl.prototype.setup = function( wsr, db ) {
    //
    // store for later use
    //
    _wsr = wsr;
    _db = db;
    //
    //
    //
    for ( var key in this ) {
        if ( key !== 'setup' && typeof this[ key ] === 'function' ) {
            console.log( 'DisplayControl connecting : ' + key );
            wsr.json( key, this[ key ] );
        }
    }
}

DisplayControl.prototype.setparameters = function( wss, ws, command ) {
    console.log( 'DisplayControl.getuserchats : user id:' + command.id );
    //
    // add chat to db
    //
    process.nextTick(function(){ 
        /*
        _db.find('chats',{$or:[{to: command.id},{from: command.id}]}).then(function( response ) {
            command.status = 'OK';
            command.response = response;
            ws.send(JSON.stringify(command));
        }).catch( function( error ) {
            command.status = 'ERROR';
            command.error = error;
            ws.send(JSON.stringify(command));
        });
        */
    }); 
}

module.exports = new DisplayControl();

