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

DisplayControl.prototype.registerdisplay = function( wss, ws, command ) {
    console.log( 'DisplayControl.registerdisplay : account : ' + command.account + ' : display display :' + command.display );
    //
    // register new display
    //
    process.nextTick(function(){ 
        _db.find( 'display', { display: command.display } ).then( function( response  ) { // check for existing registration
            if ( response.length > 0 ) {
                console.log( 'DisplayControl.registerdisplay : error : display already registered' );
                command.status = 'ERROR';
                command.response = 'display already registered';
                ws.send(JSON.stringify(command));
           } else {
               _db.findOne( 'user', { id: command.account } ).then( function( response ) {
                    _db.insert( 'display', { display: command.display, account: command.account, configuration: command.configuration || {} } ).then( function( response ) {
                        command.status = 'OK';
                        command.response = response;
                        ws.send(JSON.stringify(command));
                    }).catch( function( error ) {
                        console.log( 'DisplayControl.registerdisplay : error : insert : ' + error );
                        command.status = 'ERROR';
                        command.response = error;
                        ws.send(JSON.stringify(command));
                    });
               }).catch( function( error ) {
                    console.log( 'DisplayControl.registerdisplay : error : invalid account' );
                    command.status = 'ERROR';
                    command.response = 'invald account';
                    ws.send(JSON.stringify(command));
               });
            }
        }).catch( function( error ) {
            console.log( 'DisplayControl.registerdisplay : generic error : ' + error );
            command.status = 'ERROR';
            command.response = error;
            ws.send(JSON.stringify(command));
        });
    }); 
}

DisplayControl.prototype.updatedisplayconfiguration = function( wss, ws, command ) {
    console.log( 'DisplayControl.updatedisplayconfiguration : display id :' + command.display );
    //
    // syncronise display configuration
    //
    process.nextTick(function(){ 
        //
        // store in database
        //
        _db.update( 'display', { $and : [ { display: command.display }, { account: command.account } ] }, { $set: { configuration: command.configuration } } ).then( function( response ) {
            //
            // forward to display
            //
            _wsr.sendcommand( wss, command.display, command.account, command );
            //
            // reply to sender
            //
            command.status = 'OK';
            command.response = response;
            ws.send(JSON.stringify(command));
        }).catch( function( error ) {
            console.log( 'DisplayControl.updatedisplayconfiguration : error : ' + error );
            command.status = 'ERROR';
            command.response = error;
            ws.send(JSON.stringify(command));
        });
    }); 
}
//
//
//
DisplayControl.prototype.configuredisplay = function( wss, ws, command ) {
    console.log( 'DisplayControl.configuredisplay : display id:' + command.display );
    //
    // 
    //
    process.nextTick(function(){ 
        _db.findOne( 'display', { $and : [ { display: command.display }, { account: command.account } ] } ).then( function( response ) { 
            _wsr.sendcommand( command.display, command.account, command );
            command.status = 'OK';
            ws.send(JSON.stringify(command));
        }).catch( function( error ) {
            console.log( 'DisplayControl.configuredisplay : error : ' + error );
            command.status = 'ERROR';
            command.response = error;
            ws.send(JSON.stringify(command));
        });
    }); 
}

DisplayControl.prototype.connectdisplay = function( wss, ws, command ) {
    console.log( 'DisplayControl.connectdisplay : display id:' + command.display );
    //
    // 
    //
    process.nextTick(function(){ 
        _db.update( 'display', { $and : [ { display: command.display }, { account: command.account } ] }, { $set:{ connected: true } } ).then( function( response ) { 
            ws.mash = { display: command.display, account: command.account };
            command.status = 'OK';
            _db.findOne( 'display', { $and : [ { display: command.display }, { account: command.account } ] } ).then( function( response ) {
                command.configuration = response.configuration;
                ws.send(JSON.stringify(command));
            }).catch( function( error ) {
                ws.send(JSON.stringify(command));
            });
        }).catch( function( error ) {
            console.log( 'DisplayControl.connectdisplay : error : ' + error );
            command.status = 'ERROR';
            command.response = error;
            ws.send(JSON.stringify(command));
        });
    }); 
}

DisplayControl.prototype.disconnectdisplay = function( wss, ws, command ) {
    console.log( 'DisplayControl.disconnectdisplay : display id:' + command.display );
    //
    // 
    //
    process.nextTick(function(){ 
        _db.update( 'display', { $and : [ { display: command.display }, { account: command.account } ] }, { $set:{ connected: false } } ).then( function( response ) { // check device is registered to account
            ws.mash = undefined;
            command.status = 'OK';
            //ws.send(JSON.stringify(command));
        }).catch( function( error ) {
            console.log( 'DisplayControl.disconnectdisplay : error : ' + error );
            command.status = 'ERROR';
            command.response = error;
            //ws.send(JSON.stringify(command));
        });
    }); 
}

module.exports = new DisplayControl();

