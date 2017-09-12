let fs = require('fs');
//
// SSL config
//
function readSSL() {
    /*
    try {
        return {
            key: return fs.readFileSync('./ssl/privkey.pem');,
            cert: fs.readFileSync('./ssl/fullchain.pem'),
            ca: fs.readFileSync('./ssl/chain.pem')
        };
    } catch( error ) {
        return { 
            key: fs.readFileSync('./ssl/server.key'), 
            cert: fs.readFileSync('./ssl/server.crt')
        };
    }
    */
    return {};
 }
exports.ssl = readSSL();