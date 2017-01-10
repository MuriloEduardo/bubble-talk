var Usuario  = require('../models/usuario');
var Bubble   = require('../models/bubble');
var socketio = require('socket.io');
var _  		 = require('underscore');

// Todos usuarios que estão na aplicação
var usuarios = [];
// Usuario atual
var usuario_socket  = {};

module.exports.listen = function(server){
	var io = socketio.listen(server);
	io.sockets.on('connection', function(socket) {

		function atualizaUsuarios() {
			var currentUser = usuarios[socket.socket_id],
				typeUser 	= undefined,
				userFindId  = currentUser.socket_id==currentUser.canal_atual ? currentUser.socket_id : currentUser.canal_atual;

			if(currentUser.bubble_id!=currentUser.canal_atual)  {
				Usuario.findOne({_id: userFindId}, function(err, user){
					if(currentUser.socket_id==currentUser.canal_atual) {
						// Administrador
						user.connected = {status: socket.connected,date: new Date()};
						typeUser=1;
					} else {
						// Cliente
						var currentClient = _.find(user.conversas, function (o) { return o.socket_id == currentUser.socket_id });
						// Caso este cliente nao exista
						// É porque ele ainda nao enviou nenhuma mensagem a este administrador
						if(currentClient) currentClient.connected = {status: socket.connected,date: new Date()};
						typeUser=0;
					}
					user.save(function(err, res) {
						if(err) throw err;
					});
				});
			}
			currentUser.connected = {status: socket.connected,date: new Date()};
			socket.emit('usuarios',{user:currentUser,type:typeUser});
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
			atualizaUsuarios();

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
			
			// Coloca este usuario como offline / online
			atualizaUsuarios();
			
			// Retira tal usuario da lista de usuarios
			usuarios.splice(usuarios.indexOf(usuarios[socket.socket_id]), 1);
		});

		socket.on('trocar canal', function(novoCanal) {
			trocaCanal(novoCanal);
		});

		socket.on('digitando', function(data) {
			io.sockets.emit('digitando', data);
		});
	});
}