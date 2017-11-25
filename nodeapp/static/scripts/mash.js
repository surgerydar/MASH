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

( function( w, d ) {
    //
    // hook device selector
    //
    var deviceGuid = d.querySelector('#device-guid');
    if ( deviceGuid ) {
        deviceGuid.onkeyup = function(evt) {
            if (evt.keyCode === 13) {
                evt.preventDefault();
                rest.get( '/instance/' + deviceGuid.value, {
                   onloadend : function( evt ) {
                       d.querySelector('#device-details');
                   } 
                });
            }
        }
    }
    //
    // hook all delete buttons
    //
    var deleteButtons = d.querySelectorAll('.delete');
    for ( var i = 0; i < deleteButtons.length; ++i ) {
        (function(item){
            item.onclick = function() {
                if ( confirm( 'are you sure you want to delete this item?' ) ) {
                    var endpoint = '/mash/' + item.getAttribute('data-id');
                    rest.delete( endpoint, {
                        onloadend : function( evt ) {
                            //
                            // remove item from list
                            //
                            var mash = item.parentNode;
                            mash.parentNode.removeChild(mash);
                        },
                        onerror : function( evt ) {
                            alert( 'error delting item' );
                        }
                    });
                }
            };   
        })( deleteButtons[ i ] );
    }
})(window,document);