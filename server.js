var express      = require('express');
var app          = express();
var http         = require('http');
var server       = http.createServer(app);
var io           = require('socket.io').listen(server);
var cookieParser = require('cookie-parser');
var session      = require('express-session');
var morgan       = require('morgan');
var mongoose     = require('mongoose');
var bodyParser   = require('body-parser');
var passport     = require('passport');
var flash        = require('connect-flash');
var path         = require('path');
var api          = express.Router();

var port         = process.env.PORT || 4000;

var configDB     = require('./server/config/database');
var Usuario 	 = require('./server/models/usuario');
var Bubble  	 = require('./server/models/bubble');

mongoose.connect(configDB.url, function(err, res) {
	if(err){
		console.log('Nao foi possivel conectar a:' + configDB.url + ' com o erro: ' + err);
	}else{
		console.log('Conectado a ' + configDB.url);
	}
});

require('./server/config/passport')(passport);

app.use(morgan('dev'));
app.use(cookieParser());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(session({secret: 'anystringoftext', saveUninitialized: true, resave: true}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'public', 'site'));

app.use(express.static(path.resolve(__dirname, 'public')));

// Todos usuarios que estão na aplicação
var usuarios = [];
// Usuario atual
var usuario  = {};

io.sockets.on('connection', function(socket) {

	function atualizaUsuarios() {
		usuario.connected = {status:socket.connected,date:new Date()};
		io.sockets.emit('usuarios',usuario);
		if(usuario.bubble_id==usuario.socket_id) {
			// No Bubble
			Bubble.update({"_id" : usuario.bubble_id,"conversas" : {$elemMatch : {"socket_id": usuario.socket_id}}}, {
			    "$set" : {
			        "conversas.$.connected" : usuario.connected
			    }
			}, function(err) {
				if(err) throw err;
			});
		} else {
			// No Usuario
			Usuario.update({"_id" : usuario.canal_atual,"conversas" : {$elemMatch : {"socket_id": usuario.socket_id}}}, {
			    "$set" : {
			        "conversas.$.connected" : usuario.connected
			    }
			}, function(err) {
				if(err) throw err;
			});
		}
	}

	function trocaCanal(novoCanal) {
		socket.join(novoCanal);
		usuario.canal_atual = novoCanal;
		socket.emit('change:canal', novoCanal);
	}

	function novoUsuario(data) {
		socket.socket_id = data.socket_id;
		usuarios.push(data);
		usuario = data;
		trocaCanal(data.canal_atual);
		atualizaUsuarios();
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

	socket.on('novo administrador', function(data) {
		novoUsuario(data);
	});

	socket.on('novo cliente', function(data) {

		novoUsuario(data);

		Usuario.find({ bubbles: { "$in" : [usuario.bubble_id]} }, function(err, adms) {
			
			if(err) throw err;

			Bubble.findOne({_id: usuario.bubble_id}, function(err, bub){
				
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

		console.log(data)
		console.log('================================')

		if(data.bubble_id == data.canal_atual) {
			io.sockets.emit('nova mensagem', data);
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
			io.sockets.in(data.canal_atual).emit('nova mensagem', data);
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
		atualizaUsuarios();
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
			user.save(function(err) {
				if(err) throw err;
			});
		});
		Bubble.update({
		    "_id" : data.administrador.bubble_id
		},{
			"$pull" : {
		        "conversas" : {"socket_id": data.cliente.socket_id}
		    }
		}, function(err,r) {
			if(err) throw err;
		});
	});

	// Disconnect
	socket.on('disconnect', function(data) {
		if(!socket.socket_id) return;
		var u = usuarios.filter(function(el){return el.socket_id==socket.socket_id});
		usuarios.splice(usuarios.indexOf(u[0]), 1);
		atualizaUsuarios();
	});

	socket.on('trocar canal', function(novoCanal) {
		trocaCanal(novoCanal);
	});

	socket.on('digitando', function(data) {
		if(data.canal_atual == data.bubble_id) {
			io.sockets.emit('digitando', data);
		} else {
			io.sockets.in(data.canal_atual).emit('digitando', data);
		}
	});
});
// Public           //
// Home - One Page //
app.get('/', function(req, res){
	res.render('./index.ejs');
});

// Login
app.get('/login', function(req, res){
	res.render('./login.ejs', {message_login: req.flash('loginAviso')});
});

// Confirmação
// Convido para ser administrador receberá link para cá
// para cadastrar sua senha
// @param id client sem senha
app.get('/confirmacao/:id', function(req, res){
	res.render('./confirmacao.ejs', {id: req.params.id});
});

// Landing
app.get('/experimente-gratis', function(req, res){
	res.render('./cadastrar.ejs', {message_cadastrar: req.flash('cadastrarAviso')});
});


// Internal
// ===============

// App
require('./server/routes/app')(api);
app.use('/', api);

// API
require('./server/routes/api')(api, passport);
app.use('/api', api);

// Tratamentos de exceção
// ==============================  

// Erro 404
/*app.use(function(req, res) {
	res.render('./pages-status/404.ejs');
});*/
// Erro 500
app.use(function(error, req, res, next) {
	res.render('./pages-status/500.ejs', {error: error});
});

/*
	Run
*/
server.listen(port, function(){
	console.log('Rodando em ' + port);
});