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

var port = process.env.PORT || 4000;

var configDB = require('./server/config/database');
var Usuario  = require('./server/models/usuario');
var Bubble  = require('./server/models/bubble');

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

var usuarios = {};

io.sockets.on('connection', function(socket) {

	// Canal onde é listados todos atendentes
	// da aplicação
	var canal = 0;
	socket.join(canal);

	function updateNicknames() {
		io.sockets.emit('usuarios', Object.keys(usuarios));
	}

	function trocaCanal(novoCanal) {
		socket.leave(canal);
		socket.join(novoCanal);
		canal = novoCanal;

		socket.emit('trocou canal', canal);
	}

	socket.on('novo usuario', function(data) {

		socket.socket_id = data.socket_id;
		usuarios[socket.socket_id] = socket;

		trocaCanal(data.canal_atual);
		updateNicknames();

		var queryCanais = Usuario.find({ bubbles: { "$in" : [data.bubble_id]} });
		queryCanais.exec(function(err, docs) {
			if (err) {
				throw err;
			} else {
				Bubble.findOne({_id: data.bubble_id}, function(err, bubble){
					if (err) {
						throw err;
					} else {
						socket.emit('nao respondidas', bubble);
						socket.emit('equipe', docs);
					}
				});
			}
		});
	});

	socket.on('enviar mensagem', function(data) {

		var conversaData = {
			msg: data.msg, 
			socket_id: data.socket_id, 
			criado: new Date(),
			canal: data.canal,
			remetente: data.remetente,
			client_socket_id: data.client_socket_id,
			visulizado: false
		}

		io.sockets.emit('nova mensagem', conversaData);

		if (data.canal == data.bubble_id) {
			
			// A mensagem enviada pertence a todos
			// Ou seja:
			// Ficará salva nos documentos da aplicação
			// E não nos usuarios
			Bubble.update({_id: data.canal},{
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
		}
	});

	socket.on('trocar canal', function(novoCanal) {
		trocaCanal(novoCanal);
	});

	socket.on('visulizar', function(cliente) {
		if(usuarios[cliente.client_socket_id]) {
			usuarios[cliente.client_socket_id].emit('visulizou', cliente);
		}
	});

	socket.on('digitando', function(data) {
		io.sockets.emit('digitando', data);
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
		socket.emit('desconectado', socket.socket_id);
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