var socketio;

var events = require('events');


var consols = {};

var id = 0;

var Consol = function() {
	this.socket = null;
	this.threads = [];
	this.buffer = [];
	this.id = id++;
};

Consol.prototype = {
	__proto__: events.EventEmitter.prototype,

	msg: function(msg){
		this.socket.emit('consol', {action: 'msg', msg: msg});
	}
}


module.exports = {
	create: function(request){
		var consol = new Consol();
		consols[consol.id] = consol;
		return consol;
	},
	init: function(io){
		if(socketio)
			return;
		io.sockets.on('connection', function(socket){
			socket.on('consol', function(cmd){
				if(!consols[cmd.id])
					return socket.emit('consol', {error: true, msg: 'No console with that id.'});

				if(cmd.action == 'init'){

					consols[cmd.id].socket = socket;
					consols[cmd.id].emit('init');
				}
				else if(cmd.action == 'cmd'){
					consols[cmd.id].emit('cmd', cmd.data);
				}
				else
					return socket.emit('consol', {error: true, msg: 'Unkown command'});
			});
		});
		socketio = io;
	}
}