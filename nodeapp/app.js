var env = process.env;
var config = require('./config');
var fs = require('fs');
//var config = { ssl: { key: fs.readFileSync('./ssl/server.key'), cert: fs.readFileSync('./ssl/server.crt')}};

//
// connect to database
//
var db = require('./mash.db.js');
db.connect(
	env.MONGODB_DB_HOST,
	env.MONGODB_DB_PORT,
	env.APP_NAME,
    env.MONGODB_DB_USERNAME,
	env.MONGODB_DB_PASSWORD
).then( function( db_connection ) {
    //
    // configure express
    //
    console.log('initialising express');
    var express = require('express');
    var bodyParser = require('body-parser');
    var jsonParser = bodyParser.json();
    var mailer = require('./mailer.js');
    //
    //
    //		
    var app = express();
    //
    //
    //
    bodyParser.json( {limit:'5mb'} );
	//
	// configure express
	//
	app.set('view engine', 'pug');
    app.use(express.static(__dirname+'/static',{dotfiles:'allow'}));
    //
    // express routes
    //
	app.get('/', function (req, res) {
        res.json({ status: 'ok' });
	});
    //
    // user
    //
    app.post('/mash', jsonParser, function (req, res) {
        // store mash
        console.log( 'post mash : ' + JSON.stringify(req.body) );
        db.putMash( req.body ).then( function( response ) {
            res.json( {status: 'OK'} );
        } ).catch( function( error ) {
            res.json( {status: 'ERROR', message: error } );
        });
    });
    app.get('/mash/:time', function(req, res) {
        // all mashes later than time
        console.log( 'get mash after : ' + req.params.time );
        db.getMash(req.params.time).then( function( response ) {
            res.json( formatResponse( response, 'OK' ) );
        }).catch( function( error ) {
            res.json( formatResponse( null, 'ERROR', error ) );
        });
    });
     //
    //
    //
    function formatResponse( data, status, message ) {
        var response = {};
        if ( message ) response[ 'message' ] = message;
        if ( status ) response[ 'status' ] = status;
        if ( data ) response[ 'data' ] = data;
        return response;
    }
    //
    // remove these in production
    //
    app.get('/drop/:collection', function(req, res) {
        // get single route
        db.drop(req.params.collection).then( function( response ) {
            res.json( {status: 'OK', data: response} );
        }).catch( function( error ) {
            res.json( {status: 'ERROR', message: JSON.stringify( error ) } );
        });
    });
    app.get('/defaults', function(req, res) {
        // get single route
        db.setDefaults();
        res.json( {status: 'OK'} );
    });
    //
    // configure websockes
    //
    var wsr = require('./websocketrouter');
    //
    // create server
    //
    var httpx = require('./httpx');
    var server = httpx.createServer(config.ssl, { http:app, ws:wsr });
    //
    // start listening
    //
    try {
        server.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', () => console.log('Server started'));
    } catch( error ) {
        console.log( 'unable to start server : ' + error );
    }
}).catch( function( err ) {
	console.log( 'unable to connect to database : ' + err );
});
