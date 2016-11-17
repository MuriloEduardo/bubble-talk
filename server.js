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
var Usuario      = require('./server/models/usuario');
var Bubble       = require('./server/models/bubble');

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

io.sockets.on('connection', function(socket) {

	// Canal inicial
	var canal    = 0;
	// Todos usuarios que estão na aplicação
	var usuarios = [];
	// Usuario atual
	var usuario  = {};

	socket.join(canal);

	function atualizaUsuarios() {
		io.sockets.emit('usuarios', usuarios);
	}

	function trocaCanal(novoCanal) {
		socket.leave(canal);
		socket.join(novoCanal);
		canal = novoCanal;

		socket.emit('trocou canal', canal);
	}

	function novoUsuario(data) {

		socket.socket_id = data.socket_id;

		usuarios.push(data);

		usuario = data;

		trocaCanal(data.canal_atual);

		atualizaUsuarios();
	}

	socket.on('novo cliente', function(data) {

		novoUsuario(data);

		var query_usuarios = Usuario.find({ bubbles: { "$in" : [usuario.bubble_id]} });

		query_usuarios.exec(function(err, administradores) {
			
			if (err) throw err;

			Bubble.findOne({_id: usuario.bubble_id}, function(err, nao_particulares){
				
				if (err) throw err;

				socket.emit('nao particulares', nao_particulares);
				socket.emit('particulares', administradores);
			});
		});
	});

	socket.on('enviar mensagem', function(data) {

		io.sockets.emit('nova mensagem', data);

		/*if (data.canal == data.bubble_id) {
			
			// A mensagem enviada pertence a todos
			// Ou seja:
			// Ficará salva nos documentos da aplicação
			// E não nos usuarios
			Bubble.update({_id: usuario.bubble_id},{
				"$push": {conversas: conversaData}
			},function(err, bubble) {
				if(err) throw err;
			});
		} else {
			
			// Conversa em particular
			Usuario.update({_id: data.canal},{
				"$push": {conversas: conversaData}
			},function(err) {
				if(err) throw err;
			});
		}*/
	});

	socket.on('visualizar', function(infosAdm) {

		if(usuarios[infosAdm.client_socket_id]) {

			usuarios[infosAdm.client_socket_id].emit('visualizou', infosAdm);

			// Salvar no banco de dados
			Usuario.update({_id: infosAdm.canal_atual},{
				"$set": {conversas: infosAdm.conversas}
			},function(err) {
				if(err) throw err;
			});
		}
	});

	socket.on('tornar minha', function(infosAdm) {

		// Insere e salva no usuario
		// As conversas que estavam para todos salvos no bubble
		// e nao no usuario
		Usuario.update({_id: infosAdm.canal_atual},{
			"$push": {conversas: infosAdm.conversas[0]}
		},function(err, user){

			if(err) throw err;
			// Exclui as ja citadas mensagens que estavam no buuble, por ser de todos
			// e agora torna-se deste usuario que clicou
			Bubble.update({_id: infosAdm.bubble_id},{
				"$pull": {conversas: {socket_id: infosAdm.client_socket_id}}
			},function(err){

				if(err) throw err;
				
				trocaCanal(infosAdm.canal_atual);

				if(usuarios[infosAdm.client_socket_id]) {
					usuarios[infosAdm.client_socket_id].emit('tornou sua', infosAdm);
				}
			});
		});
	});

	// Disconnect
	socket.on('disconnect', function(data) {
		
		if(!socket.socket_id) return;

		/*for (var i = 0; i < dados_users.length; i++) {
			
			if(socket.socket_id == dados_users[i].id) {

				dados_users[i] = {
					id: socket.socket_id,
					connected: socket.connected,
					ultima_visulizacao: new Date()
				}

				Usuario.update({_id: usuarios[socket.socket_id].canal_atual},{
					"$push": {clientes: dados_users[i]}
				},function(err, docs) {
			
					if(err) throw err;

					delete usuarios[socket.socket_id];
				});
			}
		}*/

		atualizaUsuarios();
	});

	socket.on('trocar canal', function(novoCanal) {
		trocaCanal(novoCanal);
	});

	socket.on('novo administrador', function(data) {
		novoUsuario(data);
	});

	socket.on('digitando', function(data) {
		io.sockets.emit('digitando', data);
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


/*
	Internal
*/
// App
require('./server/routes/app')(api);
app.use('/', api);

// API
require('./server/routes/api')(api, passport);
app.use('/api', api);

/*
	Tratamentos de exceção
*/
// Erro 404
app.use(function(req, res) {
	res.render('./pages-status/404.ejs');
});
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