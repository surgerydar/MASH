;
var rest = {
    createrequest : function (method, url, param, delegate, headers) {
        var _this = this;
        //
        // create request object
        //
        var xhr = new XMLHttpRequest();
        //
        // 
        //
        xhr.rest = {
            delegate: (delegate != undefined) ? delegate : null,
            progress: 0,
            status: 0,
            statustext: ""
        };
        if ( delegate ) {
            //
            // hook events
            //
            if ( delegate.onloadend !== undefined ) {
                if (xhr.onloadend) {
                    if ( delegate.onload !== undefined ) {
                        xhr.addEventListener('load', function (e) {
                            delegate.onload(e);
                        }, false);
                    }
                    xhr.addEventListener('loadend', function (e) {
                        delegate.onloadend(e);
                    }, false);
                } else {
                    xhr.addEventListener('load', function (e) {
                        delegate.onloadend(e);
                    }, false);
                }
            }

            if ( delegate.onloadstart !== undefined ) {
                xhr.addEventListener('loadstart', function (e) {
                    delegate.onloadstart(e);
                }, false);
            }

            if ( delegate.onprogress !== undefined ) {
                xhr.addEventListener('progress', function (e) {
                    delegate.onprogress(e);
                }, false);
            }

            if ( delegate.onabort !== undefined ) {
                xhr.addEventListener('abort', function (e) {
                    delegate.onabort(e);
                }, false);
            }

            if ( delegate.ontimeout !== undefined ) {
                xhr.addEventListener('timeout', function (e) {
                    delegate.ontimeout(e);
                }, false);
            }

            if ( delegate.onerror !== undefined ) {
                xhr.addEventListener('error', function (e) {
                    delegate.onerror(e);
                }, false);
            }
        }
        //
        // build query string
        //
        var query = "";
        for (var key in param) {
            if (query.length == 0) {
                query += '?';
            } else {
                query += '&';
            }
            query += key + '=' + escape(param[key]);
        }
        //
        // open request
        //
        xhr.open(method, url + query, true);
        //
        // add optional headers
        //
        if (headers) {
            for (name in headers) {
                xhr.setRequestHeader(name, headers[name]);
            }
        }
        //
        //
        //
        return xhr;
    },
    //
    // 
    //
    get : function( url, delegate, headers ) {
        //
        // create request
        //
        var request = rest.createrequest("GET", url, {}, delegate, headers);
        //
        // send
        // 
        request.send();
        return request;
    },
    post : function( url, data, delegate, headers, raw ) {
        //
        // create request
        //
        if (!headers) headers = {};
        if (!headers['Content-Type']&&!raw) headers['Content-Type'] = 'application/json'; // default to JSON request body
        var request = rest.createrequest("POST", url, {}, delegate, headers);
        //
        // send data
        // 
        //
        if ( raw ) {
            request.send(data);
        } else {
            request.send(JSON.stringify(data));
        }
        return request;
    },
    put : function( url, data, delegate, headers, raw ) {
        //
        // create request
        //
        if (!headers) headers = {};
        if (!headers['Content-Type']&&!raw) headers['Content-Type'] = 'application/json'; // default to JSON request body
        var request = rest.createrequest("PUT", url, {}, delegate, headers);
        //
        // send data
        // 
        if ( raw ) {
            request.send(data);
        } else {
            request.send(JSON.stringify(data));
        }
        return request;
    },
    delete : function( url, delegate, headers ) {
        //
        // create request
        //
        var request = rest.createrequest("DELETE", url, {}, delegate, headers );
        //
        // send
        // 
        request.send();
        return request;
    },
    //
    //
    //
    iserror : function( evt ) {
        return evt.target.status >= 400;
    },
    getresponse : function( evt ) {
        var request = evt.target;
        return response = request.response === undefined ? request.responseText : request.response;
    },
    getresponsexml : function( evt ) {
        return evt.target.responseXML;
    },
    parseresponse : function( evt ) {
        var self = rest;
        var response = self.getresponse( evt );
        try {
            var json = JSON.parse( response );
            return json;
        } catch( err ) {
            return undefined;
        }
    },
    formaterror : function( evt ) {
        var self = rest;
        var request = evt.target;
        var code = request.status;
        var text = request.statusText;
        var description = self.parseresponse( evt );
        return code + ' : ' + text +  ( description && description.message ? ' : ' + description.message : '' );
    } 
};

var utils = {
    qtcolour2html : function( qtcolour ) {
        if ( typeof qtcolour === "string" ) return qtcolour;
        return 'rgba(' + qtcolour.r + ',' + qtcolour.g + ',' + qtcolour.b + ',' + qtcolour.a + ')';
    } 
};

( function( w, d ) {
    //
    // hook display instance containers
    //
    function hookdisplay( display ) {
        //
        //
        //
        var displayName = display.querySelector('.instance-header');
        if ( displayName ) {
            displayName.onclick = function() {
                var name = prompt('Rename Display', displayName.innerHTML);
                if (name != null) {
                    displayName.innerHTML = name;
                }            
            };
        }
        //
        // hook online indicator / refresh button
        //
        var indicator = display.querySelector('div[class*="online-indicator"]');
        if ( indicator ) {
            indicator.onclick = function() {
                var deviceId = update.getAttribute('data-display');
                rest.get('/display/' + deviceId, {
                    onloadend: function(evt) {
                        //display.inner
                        var response = rest.getresponse(evt);
                        console.log(response);
                        var doc = new DOMParser().parseFromString(response, "text/html");
                        if ( doc ) {
                            var container = doc.querySelector('.instance-container');
                            if ( container ) {
                                display.innerHTML = container.innerHTML;
                                hookdisplay( display );
                            }
                        }
                    }
                });
            }
        }
        //
        // hook update button
        //
        var update = display.querySelector('button[name="update-display"]');
        if ( update ) {
            console.log( 'hooking display update' );
            update.onclick = function() {
                var deviceId = update.getAttribute('data-display');
                var account = update.getAttribute('data-account');
                var configuration = {
                    //name: update.getAttribute('data-display-name'),
                    name: display.querySelector('.instance-header').innerHTML,
                    effect: Math.max( 0, Math.min( 5, parseInt(display.querySelector('input[name="effect-index"]').value) ) ),
                    textColour: display.querySelector('input[name="text-colour"]').value,
                    effectColour: display.querySelector('input[name="effect-colour"]').value,
                    globalSpeed: parseFloat(display.querySelector('input[name="global-speed"]').value)/100.,
                    effectSpeed: parseFloat(display.querySelector('input[name="effect-speed"]').value)/100.,
                    tags: display.querySelector('input[name="tags"]').value,
                    textSource: '',
                    imageSource: ''
                };
                var ws = new WebSocket( 'ws://mash.soda.co.uk' );
                ws.onopen = function() {
                    var command = {command: 'updatedisplayconfiguration', display: deviceId, account: account, configuration: configuration};
                    console.log( 'sending command : ' + JSON.stringify( command ));
                    ws.send( JSON.stringify(command));
                }
                ws.onclose = function (event) {
                    var reason;
                    // See http://tools.ietf.org/html/rfc6455#section-7.4.1
                    switch (event.code) {
                        case 1000 :
                            console.log( "Normal closure, meaning that the purpose for which the connection was established has been fulfilled." );
                            return;
                        case 1001 :
                            reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
                            break;
                        case 1002 :
                            reason = "An endpoint is terminating the connection due to a protocol error";
                            break;
                        case 1003 :
                            reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
                            break;
                        case 1004 :
                            reason = "Reserved. The specific meaning might be defined in the future.";
                            break;
                        case 1005 :
                            reason = "No status code was actually present.";
                            break;
                        case 1006 :
                            reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
                            break;
                        case 1007 :
                            reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
                            break;
                        case 1008 :
                            reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
                            break;
                        case 1009 :
                            reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
                        case 1010 : // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
                            reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
                            break;
                        case 1011 :
                            reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
                            break;
                        case 1015 :
                            reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
                            break;
                        default :
                            reason = "Unknown reason";
                    }
                    var message = 'error communicating with server : ' + event.code + ' : ' + reason;
                    console.log( message );
                    alert( message );
                };
                ws.onerror = function() {
                    console.log( 'error opening connection to server' );
                };
                ws.onmessage = function(evt) {
                    var command = JSON.parse( evt.data );
                    if ( command && command.command === 'updatedisplayconfiguration' ) {
                        switch( command.status ) {
                            case 'OK' :
                                alert( 'display updated' );
                                break;
                            case 'ERROR' :
                                alert( 'error updating display : ' + JSON.stringify(command.response) );
                                break;
                        }
                        ws.close();
                    }
                };
            };
        } else {
            console.log( 'error unable to hook display update' );
        }
    }
    var displays = d.querySelectorAll('.instance-container');
    for ( var i = 0; i < displays.length; ++i ) {
        ( function(display) {
            hookdisplay(display);
        })(displays[ i ]);
    }
    //
    // load media
    //
    var mashContainer = d.querySelector('.mash-container');
    if ( mashContainer ) {
        function hookMash( container ) {
            console.log( 'hooking mash-container' );
            var mashList = container.querySelector('.mash-list');
            if ( mashList ) {
                var count = parseInt(mashList.getAttribute( 'data-count' ));
                var pageNumber = parseInt(mashList.getAttribute( 'data-pagenumber' ));
                var pageSize = parseInt(mashList.getAttribute( 'data-pagesize' ));
                var previousButton = container.querySelector( 'button[name="previous-page"]' );
                var nextButton = container.querySelector( 'button[name="next-page"]' );
                var searchField = container.querySelector('#mash-search');
                console.log( 'count:' + count + ' pagenumber:' + pageNumber + ' pagesize:' + pageSize );
                function getSearchTags() {
                    if ( searchField ) {
                        if ( searchField.value.length > 0 ) {
                            var tags = searchField.value;
                            tags = tags.split(',');
                            if ( tags.length > 0 ) {
                                var tagString = '';
                                for ( var tag = 0; tag < tags.length; ++tag ) {
                                    tagString += tags[ tag ].trim();
                                    if ( tag < tags.length - 1 ) {
                                        tagString += ',';
                                    }
                                }
                                return tagString;
                            }
                        }
                    }
                    return 'all';
                }
                if ( searchField ) {
                    searchField.onsearch = function() {
                        loadMash(account,'all',getSearchTags(), 0, pageSize );
                    }
                }
                //
                //
                //
                if ( previousButton ) {
                    previousButton.onclick = function() {
                        loadMash(account,'all',getSearchTags(), pageNumber - 1, pageSize );
                    };
                }
                if ( nextButton ) {
                    nextButton.onclick = function() {
                        loadMash(account,'all',getSearchTags(), pageNumber + 1, pageSize );
                    };
                }
                //
                //
                //
                var mashes = mashList.querySelectorAll('.mash-list-item');
                for ( var i = 0; i < mashes.length; ++i ) {
                    (function(mash){
                        //
                        // hook delete button
                        //
                        var deleteButton = mash.querySelector('.delete');
                        if ( deleteButton ) {
                            deleteButton.onclick = function() {
                                if ( confirm( 'are you sure you want to delete this item?' ) ) {
                                    var endpoint = '/mash/' + mash.getAttribute('data-id');
                                    rest.delete( endpoint, {
                                        onloadend : function( evt ) {
                                            //
                                            // remove item from list
                                            //
                                            mash.parentNode.removeChild(mash);
                                        },
                                        onerror : function( evt ) {
                                            alert( 'error delting item' );
                                        }
                                    });
                                }
                            };   
                        }
                        //
                        // hook tag button
                        //
                        var tagButton = mash.querySelector('button[name="tag-item"]');
                        if ( tagButton ) {
                            tagButton.onclick = function() {
                                var endpoint = '/mash/' + mash.getAttribute('data-id');
                                var tags = mash.querySelector('input[name="tags"]').value;
                                tags = tags.length > 0 ? tags.split(',') : [];
                                for ( var tag = 0; tag < tags.length; ++tag ) {
                                    tags[ tag ] = tags[ tag ].trim();
                                }
                                var data = {
                                    'mash.tags': tags
                                };
                                rest.put( endpoint, data, {
                                    onloadend : function( evt ) {
                                        //
                                        // remove item from list
                                        //
                                    },
                                    onerror : function( evt ) {
                                        alert( 'error updating item' );
                                    }
                                });
                            };   
                        }

                   })( mashes[ i ] );
                }
            }
        }
        //
        //
        //
        function loadMash( account, type, tags, pagenumber, pagesize ) {
            var endpoint = '/mash/' + account.substring( 1, account.length -1 ) + '/' + type + '/' + tags + '/' + pagenumber + '/' + pagesize + '/html';
            rest.get(endpoint, {
                onloadend: function(evt) {
                    //display.inner
                    var response = rest.getresponse(evt);
                    var doc = new DOMParser().parseFromString(response, "text/html");
                    if ( doc ) {
                        var container = doc.querySelector('.mash-container');
                        if ( container ) {
                            mashContainer.innerHTML = container.innerHTML;
                            hookMash( mashContainer );
                        }
                    }
                }
            });
        }
        //
        // load mashes
        //
        var account = mashContainer.getAttribute( 'data-account' );
        loadMash( account, 'all', 'all', 0, 16 );
    }
    //
    //
    //
})(window,document);