var env = process.env;
var config = require('./config');
var fs = require('fs');
var request = require('request');
var sharp = require('sharp');
//var nlp = require('compromise')
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
    console.log('initialising server');
    var express = require('express');
    var bodyParser = require('body-parser');
    var jsonParser = bodyParser.json();
    var mailer = require('./mailer.js');
    var flash = require('connect-flash');
    //
    // authentication 
    // TODO: move this to external module
    //
    console.log( 'initialising authentication' );
    var passport = require('passport');
    var LocalStrategy = require('passport-local').Strategy;
    passport.use('login',new LocalStrategy({ passReqToCallback : true },
        function(req, username, password, callback) {
            console.log( 'authenticating : ' + username );
            db.findOne( 'user', { username: username } ).then( function(user) {
                console.log( 'found user : ' + JSON.stringify(user) );
                if (!user) callback(null, false);
                if (user.password != password) callback(null, false);
                callback(null, user);
            }).catch( function( error ) {
                callback(error);
            });
        }));
    passport.serializeUser(function(user, callback) {
        console.log( 'serialising user');
        callback(null, user.id);
    });
    passport.deserializeUser(function(id, callback) {
         console.log( 'deserialising user');
         db.findOne('user', { id:id } ).then( function(user) {
              callback(null, user);
          }).catch( function( error ) {
              callback( error );
          });
    });
    function isAuthenticated(req, res, next) {
		console.log( "path : " + req.path );
		console.log( "user : " + req.user );
		if ( req.user && req.isAuthenticated() ) {
			return next();
		} else {
			console.log(req.route);
			if( req.xhr ) {
				// ajax requests get a brief response
				console.log( 'rejecting xhr request' );
				res.status(401).json({ status : 'ERROR', message : 'no longer logged in' });
			} else {
				// all others are redirected to login
				console.log( 'redirecting to login' );
				res.redirect('/login');
			}
		}
	}
    //
    //
    //		
    
    var app = express();
    //
    //
    //
    app.use(bodyParser.json( {limit:'5mb'} ));
	app.use(bodyParser.urlencoded({'limit': '5mb', 'extended': false }));
	//
	// configure express
	//
    console.log('configuring express');
	app.set('view engine', 'pug');
    app.use(express.static(__dirname+'/static',{dotfiles:'allow'}));
    app.use(require('cookie-parser')('unusual*windy'));
    app.use(require('express-session')({ secret: 'unusual*windy', resave: false, saveUninitialized: false }));
	app.use(passport.initialize());
	app.use(passport.session());
    //
    // express routes
    //
    console.log('initialising routes');
	app.get('/', function (req, res) {
        res.json({ status: 'ok' });
	});
    //
    // mash
    //
    app.post('/mash', jsonParser, function (req, res) {
        // store mash
        db.putMash( req.body ).then( function( response ) {
            res.json( {status: 'OK'} );
        } ).catch( function( error ) {
            res.json( {status: 'ERROR', message: error } );
        });
    });
    app.delete('/mash/:id', function (req, res) {
        // remove mash
        console.log( 'deleting mash : ' + req.params.id );
        let _id = db.ObjectId(req.params.id);
        db.remove( 'mash',  { _id: _id } ).then( function( response ) {
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
    app.get('/s/:id/:image', function(req, res) {
        let redirUrl = 'https://dl.dropboxusercontent.com:443/s/' + req.params.id + '/' + req.params.image;
        if ( req.query.width && req.query.height ) {
            let width = parseInt(req.query.width);
            let height = parseInt(req.query.height);
            let transform = sharp().resize(width, height).max();
            request(redirUrl).pipe(transform).pipe(res);
        } else {
            request(redirUrl).pipe(res);
        }
    });
    //
    // authentication
    //
    app.get('/login', function(req, res){
        res.render('login');
    });
    app.post('/login', passport.authenticate('login', { failureRedirect: '/login', successRedirect: '/admin', }), function(req, res) {
        res.redirect('/admin');
    });
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/login');
    });
    //
    // admin
    //
    app.get('/admin', isAuthenticated, function(req, res) {
        db.find( 'mash', {"mash.type": "image"} ).then( function( images ) {
            db.find( 'mash', {"mash.type": "text"} ).then( function( texts ) {
                res.render('admin', { title: "MASH Admin", images: images, texts: texts } );
            }).catch( function( error ) {
                res.render('error', { message: error } );
            });
        }).catch( function( error ) {
            res.render('error', { message: error } );
        });
    });
    app.get('/instance/:id', isAuthenticated, function(req, res) {
        var id = req.param.id.unescape();
        var instance = wsr.getInstance(server.ws, req.param.id );
        res.render( 'instance', { instance: instance } );
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
    // configure websockets
    //
    console.log('creating websocketrouter');
    var wsr = require('./websocketrouter');
    //
    //
    //
    console.log('creating displaycontrol');
    let displaycontrol = require('./displaycontrol');
    displaycontrol.setup(wsr,db);
    //
    // direct commands
    //
    app.post('/direct', jsonParser, function (req, res) {
        // store mash
        console.log( 'post direct : ' + JSON.stringify(req.body) );
        try {
            wsr.send(server.ws, req.body.instance, req.body.command);
            res.json( {status: 'OK'} );
        } catch( error ) {
            res.json( {status: 'ERROR', message: error } );
        }
    });
    //
    // create server
    //
    console.log('creating server');
    var httpx = require('./httpx');
    var server = httpx.createServer(config.ssl, { http:app, ws:wsr });
    //
    // start listening
    //
    console.log('starting server');
    try {
        server.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', () => console.log('Server started'));
    } catch( error ) {
        console.log( 'unable to start server : ' + error );
    }
}).catch( function( err ) {
	console.log( 'unable to connect to database : ' + err );
});
