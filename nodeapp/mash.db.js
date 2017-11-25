//
// database
//
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var bcrypt = require('bcryptjs');

function Db() {
}

Db.prototype.connect = function( host, port, database, username, password ) {
	host 		= host || '127.0.0.1';
	port 		= port || '27017';
	database 	= database || 'mash';
	var authentication = username && password ? username + ':' + password + '@' : '';
	var url = host + ':' + port + '/' + database;
	console.log( 'connecting to mongodb://' + authentication + url );
	var self = this;
	return new Promise( function( resolve, reject ) {
		try {
			MongoClient.connect('mongodb://'+ authentication + url, function(err, db) {
				if ( !err ) {
					console.log("Connected to database server");
					self.db = db;
                    //
                    //
                    //
					resolve( db );
				} else {
					console.log("Unable to connect to database : " + err);
					reject( err );
				}
			});
		} catch( err ) {
			reject( err );
		}
	});
}

Db.prototype.putMash = function( data ) {
    var db = this.db;
    return new Promise( function( resolve, reject ) {
        if ( false ) {/*data.mash === undefined || 
                data.mash.type === undefined || 
                data.mash.content === undefined || 
                data.mash.content.length() === 0 ||  
                data.mash.type.length() === 0 || 
                !( data.mash.type === "text" || data.mash.type === "image" ) ) {*/
            reject('invalid mash')
        } else {
            try {
                data.time = Date.now();
                if ( data.content ) {
                    data.content = data.content.trim(); // trim whitespace
                }
                db.collection( 'mash' ).insertOne(data,function(err,result) {
                   if ( err ) {
                       reject( err );
                   } else {
                       resolve( 'stored' );
                   }
                });
            } catch( err ) {
                console.log( err );
                reject( err );
            }
        }
    });

}

Db.prototype.getMash = function( time ) {
    var db = this.db;
    return new Promise( function( resolve, reject ) {
        console.log( 'getMash(' + time + ')');
         try {
             db.collection('mash').find( { time: { $gt: parseInt(time) } }).toArray(function( err, result ) {
                if ( err ) {
                    console.log( err );
                    reject( err );
                } else if( result ) {
                    resolve( result );
                } else {
                    console.log( 'no mash' );
                    reject( 'no mash' );
                }
             });
        } catch( err ) {
            console.log( err );
            reject( err );
        }
    });
}
//
// generic methods
//
Db.prototype.insert = function( collection, data ) {
	var db = this.db;
	return new Promise( function( resolve, reject ) {
		try {
			db.collection( collection ).insert( data, function(err,result) {
				if ( err ) {
					reject( err );
				} else {
					resolve( result );
				}
			});
		} catch( err ) {
			reject( err );
		}
	});
}
Db.prototype.find = function( collection, query, projection ) {
	var db = this.db;
	return new Promise( function( resolve, reject ) {
		try {
			db.collection( collection ).find( query, projection ).toArray( function(err,result) {
				if ( err ) {
					reject( err );
				} else {
					resolve( result );
				}
			});
		} catch( err ) {
			reject( err );
		}
	});
}

Db.prototype.findOne = function( collection, query, projection ) {
	var db = this.db;
	return new Promise( function( resolve, reject ) {
		try {
			db.collection( collection ).findOne( query, projection, function(err, result) {
				if ( err ) {
					reject( err );
                } else if ( result ) {
                    resolve( result );
				} else {
					reject( new Error( 'no documents matching query ' + JSON.stringify(query) + ' found in collection ' + collection ) );
				}
			});
		} catch( err ) {
			reject( err );
		}
	});
}

Db.prototype.update = function( collection, query, update, options ) {
	var db = this.db;
	return new Promise( function( resolve, reject ) {
		try {
            options = options || {};
			db.collection( collection ).update( query, update, options, function(err, result) {
				if ( err ) {
					reject( err );
				} else {
					resolve( result );
				}
			});
		} catch( err ) {
			reject( err );
		}
	});
}

Db.prototype.remove = function( collection, query, update, options ) {
	var db = this.db;
	return new Promise( function( resolve, reject ) {
		try {
			db.collection( collection ).remove( query, function(err,result) {
				if ( err ) {
					reject( err );
				} else {
					resolve( result );
				}
			});
		} catch( err ) {
			reject( err );
		}
	});
}

Db.prototype.drop = function( collection ) {
	var db = this.db;
	return new Promise( function( resolve, reject ) {
		try {
			db.collection( collection ).drop(function(err,result) {
				if ( err ) {
					reject( err );
				} else {
					resolve( result );
				}
			});
		} catch( err ) {
			reject( err );
		}
	});
}

Db.prototype.ObjectId = function( hex ) {
    return new ObjectId.createFromHexString(hex);
}

module.exports = new Db();

