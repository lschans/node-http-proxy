var httpProxy = exports,
    extend    = require('util')._extend,
    parse_url = require('url').parse,
    EE3       = require('eventemitter3').EventEmitter,
    web       = require('./passes/web-incoming'),
    ws        = require('./passes/ws-incoming');

httpProxy.createWebProxy = createRightProxy('web');
httpProxy.createWsProxy  = createRightProxy('ws');
httpProxy.Server         = ProxyServer;

/**
 * Returns a function that creates the loader for
 * either `ws` or `web`'s  passes.
 *
 * Examples:
 *
 *    httpProxy.createRightProxy('ws')
 *    // => [Function]
 *
 * @param {String} Type Either 'ws' or 'web'
 * 
 * @return {Function} Loader Function that when called returns an iterator for the right passes
 *
 * @api private
 */

function createRightProxy(type) {
  var passes = (type === 'ws') ? ws : web;

  return function(options) {

    passes = Object.keys(passes).map(function(pass) {
      return passes[pass];
    });

    return function(req, res /*, [head], [opts] */) {
      var self = this,
          args = [].slice.call(arguments),
          cntr = args.length - 1,
          head;

      if(
        !(args[cntr] instanceof Buffer) &&
        args[cntr] !== res
      ) {
        //Copy global options
        options = extend({}, options);
        //Overwrite with request options
        extend(options, args[cntr]);

        cntr--;
      }

      if(args[cntr] instanceof Buffer) {
        head = args[cntr];
      }

      ['target', 'forward'].forEach(function(e) {
        if (typeof options[e] === 'string')
          options[e] = parse_url(options[e]);
      });


      for(var i=0; i < passes.length; i++) { 
        /**
         * Call of passes functions
         * pass(req, res, options, head)
         *
         * In WebSockets case the `res` variable
         * refer to the connection socket
         * pass(req, socket, options, head)
         */
        if(passes[i](req, res, this, head)) { // passes can return a truthy value to halt the loop
          break;
        }
      }
    };
  };
}


function ProxyServer(options, web, ws) {
  this.web     = web;
  this.ws      = ws;
  this.options = options;
}

ProxyServer.prototype.listen = function(port) {
  var self    = this,
      closure = function(req, res) { self.web(req, res); },
      server  = options.ssl ? 
        https.createServer(this.options.ssl, closure) : 
        http.createServer(closure);

  if(options.ws) {
    server.on('upgrade', function(req, socket, head) { self.ws(req, socket, head); });
  }

  server.listen(port);

  return server;
};

ProxyServer.prototype.before = function() {};
ProxyServer.prototype.after = function() {};

require('util').inherits(ProxyServer, EE);