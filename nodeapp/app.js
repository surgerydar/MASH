var env     = process.env;
var config  = require('./config');
var fs      = require('fs');
var request = require('request');
var sharp   = require('sharp');
var nlp     = require('compromise');
var bcrypt  = require('bcryptjs');
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
    passport.use('login', new LocalStrategy(
        { passReqToCallback : true },
        function(req, username, password, callback) {
            console.log( 'authenticating : ' + username );
            db.findOne( 'user', { username: username } ).then( function(user) {
                console.log( 'found user : ' + JSON.stringify(user) );
                if (user && bcrypt.compareSync(password, user.password) ) {
                    callback(null, user);
                } else {
                    callback(null, false);
                }
            }).catch( function( error ) {
                callback(null,false);
            });
        }));
    passport.serializeUser(function(user, callback) {
        callback(null, user.id);
    });
    passport.deserializeUser(function(id, callback) {
         db.findOne('user', { id:id } ).then( function(user) {
              callback(null, user);
          }).catch( function( error ) {
              callback( error );
          });
    });
    function isAuthenticated(req, res, next) {
		console.log( "path : " + req.path );
		if ( req.user && req.isAuthenticated() ) {
            console.log( "user : " + JSON.stringify(req.user) );
			return next();
		} else {
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
    //
    //
    //
	app.use(bodyParser.urlencoded({'limit': '5mb', 'extended': false }));
    //
    // error handling
    //
    /*
    app.use(function (err, req, res, next) {
    
    });
    */
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
        var account = req.body.account;
        db.findOne( 'user', { id: account } ).then( function( response ) {
            //
            // preprocess tags
            //
            if ( req.body.mash.tags ) {
                if ( typeof req.body.mash.tags === 'string' ) {
                    req.body.mash.tags = req.body.mash.tags.split(',');
                }
                for ( var i = 0; i < req.body.mash.tags.length; ++i ) {
                    req.body.mash.tags[ i ] = req.body.mash.tags[ i ].trim().toLowerCase();
                }
           } else {
                req.body.mash.tags = [];
            }
            //
            // extract aditional tags from content
            // TODO: shift this into module
            //
            if ( req.body.mash.type === 'text' ) {
                try {
                    var text = nlp(req.body.mash.content);
                    var topics = text.topics();
                    if ( topics ) {
                        topics = topics.not('#Possessive');
                        var topicTags = topics.out('array');
                        if( topicTags ) {
                            topicTags.forEach( function( topic ) {
                                topic = topic.toLowerCase();
                                if ( req.body.mash.tags.indexOf(topic) < 0 ) {
                                    req.body.mash.tags.push(topic);
                                }
                            });
                        }
                    }
                } catch( error ) {
                    console.log( 'error extracting topics : ' + error );
                }
                //
                // extract # and @
                //
                try {
                    var regexp = /[#@][a-z0-9_]+/g;
                    var hashtags = req.body.mash.content.toLowerCase().match( regexp );
                    if ( hashtags ) {
                        hashtags.forEach( function( hashtag ) {
                            hashtag = hashtag.substring(1);
                            if ( req.body.mash.tags.indexOf(hashtag) < 0 ) {
                                req.body.mash.tags.push(hashtag);
                            }
                        });
                    }
                } catch( error ) {
                    console.log( 'error extracting hashtags : ' + error );
                }
            }
            //
            // store mash
            //
            db.putMash( req.body ).then( function( response ) {
                res.json( {status: 'OK'} );
            } ).catch( function( error ) {
                res.json( {status: 'ERROR', message: error } );
            });
        }).catch( function( error ) {
            res.json( {status: 'ERROR', message: error } );
        });
    });
    app.put('/mash/:id', isAuthenticated, jsonParser, function (req, res) {
        console.log( 'put mash ' + req.params.id );
        var _id = db.ObjectId(req.params.id);
        db.update( 'mash', { _id: _id }, { $set : req.body } ).then( function( response ) {
            res.json( {status: 'OK'} );
        }).catch( function( error ) {
            res.json( {status: 'ERROR', message: error } );
        });
    });
    app.delete('/mash/:id', isAuthenticated, function (req, res) { // only accessable from admin interface
        // remove mash
        console.log( 'deleting mash : ' + req.params.id );
        var _id = db.ObjectId(req.params.id);
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
    app.get('/mash/:account/:tags', function(req, res) {
        // all mashes posted to account with optional tags
        console.log( 'get mash for account : ' + req.params.account );
        //
        // build query
        //
        var query = { account: '{' + req.params.account + '}' };
        var tags = req.params.tags;
        if ( tags !== 'all' ) {
            tags = tags.split(',');
            query['mash.tags'] = { $all: tags };
        }
        db.find( 'mash', query ).then( function( response ) {
            res.json( formatResponse( response, 'OK' ) );
        }).catch( function( error ) {
            res.json( formatResponse( null, 'ERROR', error ) );
        });
    });
    app.get('/mash/:account/:type/:tags/:pagenumber/:pagesize/:format', function(req, res) {
        // all mashes posted to account with optional tags, result is pagenumber with pagesize
        // page count is returned in result
        console.log( 'get mash for account : ' + req.params.account );
        //
        // build query
        //
        var query = { account: '{' + req.params.account + '}' };
        var type = req.params.type;
        if ( type !== 'all' ) {
            query['mash.type'] = type;
        }
        var tags = req.params.tags;
        if ( tags !== 'all' ) {
            tags = tags.split(',');
            query['mash.tags'] = { $all: tags };
        }
        //
        // count total matches
        //
        db.count( 'mash', query ).then( function( count ) {
            console.log( 'found ' + count + ' entries of type ' + type );
            var pagenumber = parseInt(req.params.pagenumber);
            var pagesize = parseInt(req.params.pagesize);
            var offset = pagenumber * pagesize;
            db.find( 'mash', query, {}, offset, pagesize ).then( function( entries ) {
                var response = {
                    tags: tags === 'all' ?  [] : tags,
                    count: count,
                    pagenumber: pagenumber,
                    pagesize: pagesize,
                    entries: entries
                };
                if ( req.params.format === 'html' ) {
                    res.render('mashpage', { search: response });
                } else {
                    res.json( formatResponse( response, 'OK' ) );
                }
            }).catch( function( error ) {
                res.json( formatResponse( null, 'ERROR', error ) );
            });
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
    app.get('/register/:account/:email', function( req, res ) {
        db.findOne( 'user', { $and : [ { account: req.params.account }, { email: req.params.email } ] } ).then( function( user ) {
            res.render('register', { title: 'Mash - register', username: user.username, email: user.email } );
        }).catch( function( error ) {
            res.render('error', { message: "inavalid account or email" } );
        });
        
    });
    app.post('/register', function(req, res) {
        /*
        db.update( 'user', 
                  { username: req.body.username, email: req.body.email, account: req.body.account}, 
                  { $set: { {username: req.body.username, password: req.body.password} } } ).then( function(response) {
            res.redirect('/admin');
        }).catch( function( error ) {
            res.render('error', { message: 'registration error : ' + error } );
        });
        */
        res.json( formatResponse( null, 'ERROR', 'invalid operation' ) );    
    });
    app.get('/setpassword/:id/:key', function( req, res ) {
        db.findOne( 'user', { $and : [ { account: req.params.account }, { email: req.params.email } ] } ).then( function( user ) {
            res.render('setpassword', { title: 'Mash - set password', username: user.username, email: user.email } );
        }).catch( function( error ) {
            res.render('error', { message: "inavalid request" } );
        });
        
    });
    /*
    const updatekey = 'freddo1203';
    app.get('/updatedb/:key', function( req, res ) {
        if ( req.params.key === updatekey ) {
            db.find( 'user', {} ).then( function( users ) {
                var salt = bcrypt.genSaltSync(10);
                users.forEach( function( user ) {
                    db.update( 'user', { username: user.username }, { $set: { password: bcrypt.hashSync(user.password, salt) } } ).then( function( response ) {
                        
                    }).catch( function( error ) {
                        
                    });
                });
                res.redirect('/login');
            }).catch( function( error ) {
                res.render('error', { message: 'update error : ' + error } );
            });
        }
    });
    */
    //
    // admin
    //
    app.get('/admin', isAuthenticated, function(req, res) {
        db.find( 'display', { account: req.user.id } ).then( function( displays ) {
            res.render('admin', { title: "MASH Admin", account: req.user.account, displays: displays } );
        } ).catch( function( error ) {
            res.render('error', { message: JSON.stringify( error ) } );
        });
    });
    //
    //
    //
    app.get('/account', isAuthenticated, function(req, res) {
        res.render('account', { message: JSON.stringify( error ) } );
        /*
        db.find( 'mash', {"mash.type": "image"} ).then( function( images ) {
            db.find( 'mash', {"mash.type": "text"} ).then( function( texts ) {
                db.find( 'display', { account: req.user.id } ).then( function( displays ) {
                    res.render('admin', { title: "MASH Admin", account: req.user.id, images: images, texts: texts, displays: displays } );
                } ).catch( function( error ) {
                    res.render('error', { message: JSON.stringify( error ) } );
                });
            }).catch( function( error ) {
                res.render('error', { message: JSON.stringify( error ) } );
            });
        }).catch( function( error ) {
            res.render('error', { message: JSON.stringify( error ) } );
        });
        */
    });
    app.get('/display/:id', isAuthenticated, function(req, res) {
        var id = req.params.id;
        db.findOne( 'display', { $and: [ { account: req.user.id }, { display: id } ] } ).then( function( response ) {
            res.render( 'display', { display: response } );
        }).catch( function( error ) {
            res.render('error', { message: JSON.stringify( error ) } );
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
        var account = req.body.account;
        if ( account.indexOf('{') !== 0 ) {
            account = '{' + account;
        }
        if ( account.indexOf('}') !== account.length - 1 ) {
            account += '}';
        } 
        db.findOne( 'user', { id: account } ).then( function( response ) {
            try {
                wsr.sendcommand( server.ws, req.body.instance, req.body.account, req.body.command );
                res.json( {status: 'OK'} );
            } catch( error ) {
                res.json( {status: 'ERROR', message: error } );
            }
        }).catch( function( error ) {
            res.json( {status: 'ERROR', message: 'invalid account' } );
        });
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
