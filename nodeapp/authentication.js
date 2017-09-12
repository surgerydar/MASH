var jwt = require('jsonwebtoken');

function Authentication() {
    this.routes = {
        register: function( wss, ws, command ) {
            //
            // command = { command: 'register', username: '', email: '', password: '' }
            //
            // this relies on user with usename and email having already registered at table
            //
            //
            // verify registration, check for user with username and password, retrieve fingerprint
            //
            var query = {
                $and: [
                    { username: command.username },
                    { email: command.email }
                ]
            }
            //
            // return status & jwt ( so default login )
            //
        },
        login: function( wss, ws, command ) {
            //
            // command = { command: 'login', $or: [ {username: ''} , { email: ''} ], password: '' }
            //
            //
            // check database for user
            //
            var query = {
                $and : [
                    { password: command.password },
                    { email: command.email }
                ]
            }
            var projection = { username: 1, email: 1 };
            this.db.find( 'users', query, projection ).then( function( error, result ) {
                if ( error ) {
                    
                } else {
                    //
                    // create key
                    //
                    
                    //
                    // store key
                    //
                    
                    //
                    // return status and key
                    //
                }
            }).catch(function(error){
                
            });
            //
            // return status & jwt of username / email / _id
        },
        logout: function( wss, ws, command ) {

        }
       
    }
}

Authentication.prototype.connect = function( ws, db, config ) {
    this.db = db;
    this.cert = config && config.ssl ? config.ssl.cert : undefined;
    //
    //
    //
    for ( var key in this.routes ) {
        console.log( 'Authentication connecting : ' + key );
        wsr.json( key, this.routes[ key ] );
    }
}

Authentication.prototype.isLoggedIn = function( ) {
    
}


