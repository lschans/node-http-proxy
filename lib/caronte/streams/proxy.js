var Duplex   = require('stream').Duplex,
    common   = require('../common'),
    http     = require('http'),
    https    = require('https');

function ProxyStream() {
  var self = this;

  Duplex.call(this);

  this.once('pipe', function(pipe) { self.onPipe(pipe); }); 
  this.once('finish', function() { self.onFinish(); }); 
}

ProxyStream.prototype.onPipe = function(request) {
  var self = this;

  this.proxyReq = (options.ssl ? https : http).request(
    common.setupOutgoing(options.ssl || {}, options, request)
  );

  this.proxyReq.once('response', function(response) {
    self.onResponse(response);
  })
  this.proxyReq.on('error', function() {}); // XXX TODO: add error handling
}

ProxyStream.prototype.onFinish = function() {
  
}

ProxyStream.prototype.onResponse = function() {

}

ProxyStream.prototype._read = function() {}

ProxyStream.prototype._write = function() {}

require('util').inherits(ForwardStream, Duplex);