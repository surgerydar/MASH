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
    let clientId = ++this.clientId;
    console.log( 'connection from : ' + clientId );
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
        console.log( 'connection closed : ' + clientId );
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
                if ( command.command === 'thankyou' ) {
                    console.log( 'processing command : ' + command.command + ' : instance : ' + command.instance );
                    ws.instance = command.instance;
                } else {
                    console.log( 'WebSocketRouter.message : unable to process message ' + message  );
                }
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

WebSocketRouter.prototype.relay = function( wss, ws, command ) {
    //
    // relay to all other sockets
    //
    var message = JSON.stringify( command );
    console.log('WebSocketRouter.relay:' + command.command);
    wss.clients.forEach(function(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

WebSocketRouter.prototype.send = function( wss, instance, command ) {
    //
    // send to specific instance
    //
    var message = JSON.stringify( command );
    console.log('WebSocketRouter.send:' + message + ' to ' + instance);
    wss.clients.forEach(function(client) {
        console.log( 'client.instance=' + client.instance );
        if (client.instance === instance && client.readyState === WebSocket.OPEN) {
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