var Usuario  = require('../models/usuario');
var Bubble   = require('../models/bubble');
var socketio = require('socket.io');

// Todos usuarios que estão na aplicação
var usuarios = [];
// Usuario atual
var usuario_socket  = {};

module.exports.listen = function(server){
	var io = socketio.listen(server);
	io.sockets.on('connection', function(socket) {

		function atualizaUsuarios(data) {

			console.log("============================================0===============")
			console.log(data)
			console.log("===========================================================")

			if(data.canal_atual == data.socket_id) {
				console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
				console.log(data)
				console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
			}

			var u = usuarios.filter(function(el){return el.socket_id==socket.socket_id})[0];
			if(u) {
				u.connected = socket.connected;
				io.sockets.emit('usuarios',usuarios);
			    
			    if(usuario_socket.socket_id==usuario_socket.canal_atual&&usuario_socket.canal_atual!=usuario_socket.bubble_id) {
			    	Usuario.update({
						"_id": usuario_socket.canal_atual
					},{
					    "connected.status": u.connected
				    }, function(err,e) {
				    	if(e.nModified<=0) {
				    		//throw '11111111111111111111111111111111111111111';
				    		console.log('** ERROR 1 **')
				    	}
						if(err) throw err;
					});
			    } else {
			    	Usuario.update({
						"_id": usuario_socket.canal_atual,
						"conversas": {
							$elemMatch: {
								"socket_id": usuario_socket.socket_id
							}
						}
					},{
					    "$set": {
					        "conversas.$.connected.status": u.connected
					    }
				    }, function(err,e) {
				    	if(e.nModified<=0) {
				    		throw '2222222222222222222222222222222222222222';
				    	}
						if(err) throw err;
					});
			    }
			}
		}

		function trocaCanal(novoCanal) {
			socket.leave(socket.room);

			socket.join(novoCanal);
			usuario_socket.canal_atual = novoCanal;
			socket.emit('change:canal', novoCanal);
		}

		function novaMsgBubble(data) {
			Bubble.update({
			    "_id" : data.bubble_id,
			    "conversas" : {
			        $elemMatch : {"socket_id": data.socket_id}
			    }
			}, {
			    "$push" : {
			        "conversas.$.mensagens" : data.mensagem
			    }
			}, function(err,data) {
				if(err) throw err;
			});
		}

		function novaMsgAdm(data) {
			var _id = data.cliente_socket_id ? data.cliente_socket_id : data.socket_id;
			Usuario.update({
			    "_id" : data.canal_atual,
			    "conversas" : {
			        $elemMatch : {"socket_id": _id}
			    }
			}, {
			    "$push" : {
			        "conversas.$.mensagens" : data.mensagem
			    }
			}, function(err) {
				if(err) throw err;
			});
		}

		socket.on('novo usuario', function(data) {

			socket.socket_id = data.socket_id;
			usuarios[data.socket_id] = data;

			trocaCanal(data.canal_atual);
			atualizaUsuarios(data);

			Usuario.find({ bubbles: { "$in" : [usuarios[data.socket_id].bubble_id]} }, function(err, adms) {
				
				if(err) throw err;

				Bubble.findOne({_id: usuarios[data.socket_id].bubble_id}, function(err, bub){
					
					if(err) throw err;

					adms.push(bub);

					socket.emit('conversas', adms.reverse());
				});
			});
		});

		socket.on('sent:mensagem', function(data) {

			// Para ele mesmo
			// OU
			// Para com quem esta enviando (Administrador)
			var user_data = {
				canal_atual: data.canal_atual,
				socket_id: data.socket_id,
				bubble_id: data.bubble_id
			};

			io.sockets.emit('nova mensagem', data);

			if(data.bubble_id == data.canal_atual) {
				// Bubble
				Bubble.findOne({_id: data.bubble_id}, function(err, bubble){
					var clientes = bubble.conversas.filter(function(el){ return el.socket_id==data.socket_id});
					if(!clientes.length) {
						// Cliente ainda não existe
						bubble.conversas.push(user_data);
						bubble.save(function(err,res) {
							if(err) throw err;
							novaMsgBubble(data);
						});
					} else {
						novaMsgBubble(data);
					} 
				});
			} else {
				var _id = data.cliente_socket_id ? data.cliente_socket_id : data.socket_id;
				// Usuario
				Usuario.findOne({_id: data.canal_atual}, function(err, user){
					var clientes = user.conversas.filter(function(el){return el.socket_id==_id});
					if(!clientes.length) {
						user.conversas.push(user_data);
						user.save(function(err) {
							if(err) throw err;
							novaMsgAdm(data);
						});
					} else {
						novaMsgAdm(data);
					} 
				});
			}
		});

		socket.on('visualizar', function(data) {
			io.sockets.in(data.usuario.canal_atual).emit('visualizou', data.usuario);
			var _id = data.usuario.cliente_socket_id ? data.usuario.cliente_socket_id : data.usuario.socket_id;
			var msgs = data.conversa.conversas ? data.conversa.conversas : data.conversa.mensagens;
			atualizaUsuarios(data);
			Usuario.update({
			    "_id" : data.usuario.canal_atual,
			    "conversas" : {
			        $elemMatch : {"socket_id": _id}
			    }
			}, {
			    "$set" : {
			        "conversas.$.mensagens" : msgs
			    }
			}, function(err) {
				if(err) throw err;
			});
		});

		socket.on('change:particular', function(data) {
			io.sockets.emit('change:particular', data);
			Usuario.findOne({_id: data.administrador.socket_id}, function(err, user){
				var c = user.conversas.filter(function(el){return el.socket_id==data.cliente.socket_id});
				// PRESTAR ATENÇÃO //
				// Se ja existe uma conversa com este socket_id
				// Significa que o cliente conversou em particular com este administrador
				// Mas voltou a enviar mensagens para todos da equipe
				// E novamente este administrador tornou esta conversa particular
				if(c.length) {
					for (var i = 0; i < data.cliente.mensagens.length; i++) {
						user.conversas.push(data.cliente.mensagens[i]);
					}
				} else {
					user.conversas.push(data.cliente);
				}
				user.save(function(err,res_user) {
					if(err) throw err;
					Bubble.update({"_id":data.administrador.bubble_id},{"$pull":{"conversas":{"socket_id":data.cliente.socket_id}}},function(err,res_bubble){
						if(err) throw err;
					});
				});
			});
		});

		// Disconnect
		socket.on('disconnect', function(data) {
			if(!socket.socket_id) return;
			var u = usuarios.filter(function(el){return el.socket_id==socket.socket_id});
			usuarios.splice(usuarios.indexOf(u[0]), 1);
			atualizaUsuarios(u);
		});

		socket.on('trocar canal', function(novoCanal) {
			/*
			*/
			trocaCanal(novoCanal);
		});

		socket.on('digitando', function(data) {
			/*
			*/
			io.sockets.emit('digitando', data);
		});
	});
}