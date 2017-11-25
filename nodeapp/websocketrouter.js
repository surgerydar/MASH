var WebSocket = require('ws');

function WebSocketRouter() {
    this.jsonRoutes = {};
    this.binaryRoutes = {};
    this.clientId = 0;
}

WebSocketRouter.prototype.connection = function(wss,ws) {
    let self = this;
    //
    //
    //
    console.log( 'new connection' );
    ws.on('message', (message) => {
        self.message(wss,ws,message);
    });
    ws.on('ping', (data) => {
        ws.pong(data);
    });
    ws.on('pong', (data) => {
        
    });
    ws.on('error', (error) => {
        console.log('WebSocketRouter.socketError: ' + error);
    });
    ws.on('close', (code,reason) => {
        console.log( 'connection closed' );
    });
    //
    //
    //
    let response = { command: 'welcome' };
    ws.send(JSON.stringify(response));
}

WebSocketRouter.prototype.message = function( wss, ws, message ) {
    try {
        if ( typeof message === 'string' ) {
            //
            // JSON command
            // { command: 'name', guid: 'guid', param: .... }
            //
            let command = JSON.parse( message );
            if ( command && this.jsonRoutes[ command.command ] ) {
                console.log( 'processing command : ' + command.command );
                this.jsonRoutes[ command.command ]( wss, ws, command );
            } else {
                console.log( 'WebSocketRouter.message : unable to process message ' + message  );
            }
        } else {
            //
            // binary command
            // [ 4 byte selector ][ data ]
            //
            let selector = message.toString('ascii',0,4);
            if ( this.binaryRoutes[ selector ] ) {
                this.binaryRoutes[ selector ]( wss, ws, message );
            } else {
                console.log( 'WebSocketRouter.message : unable to process binary message ' + selector  );
            }
        }
    } catch( error ) {
        console.log( 'WebSocketRouter.message : ' + error + ' : unable to process message ' + typeof message === 'string' ? message : '' );
    }
}

WebSocketRouter.prototype.sendcommand = function( wss, guid, account, command ) {
    //
    // send to specific instance
    //
    var message = JSON.stringify( command );
    console.log('WebSocketRouter.send:' + message + ' to ' + guid);
    wss.clients.forEach(function(client) {
        if (client.mash && client.mash.guid === guid && client.mash.account === account && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}


WebSocketRouter.prototype.json = function( command, handler ) {
    this.jsonRoutes[ command ] = handler;
}

WebSocketRouter.prototype.binary = function( selector, handler ) {
    this.binaryRoutes[ selector ] = handler;
}

module.exports = new WebSocketRouter();