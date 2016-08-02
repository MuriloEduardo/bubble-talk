var Usuario = require('../models/usuario');
var Bubble = require('../models/bubble');
var mongoose = require('mongoose');

module.exports = function(router, passport, io){

	  ///////////////////////////////////////////////
	 //                  USUARIOS                 //
	///////////////////////////////////////////////

	// CADASTRAR UM NOVO USUARIO
	router.post('/experimente-gratis', passport.authenticate('local-signup', {
		successRedirect: '/app',
		failureRedirect: '/experimente-gratis',
		failureFlash: true
	}));

	// EFETUA O LOGIN APARTIR DE EMAIL E SENHA //
	router.post('/login', passport.authenticate('local-login', {
		successRedirect: '/app',
		failureRedirect: '/login',
		failureFlash: true
	}));

	// CRIAR NOVO ADMINISTRADOR //
	router.post('/new-adm', isLoggedIn, function(req, res){
		
		Usuario.findOne({'local.email': req.body.local.email}, function(err, user){
			if(!user){
				var novoAdm = new Usuario();
				novoAdm.local = req.body.local;
				novoAdm.propriedades.push(req.body.propriedade);

				novoAdm.save(function(err, data1){
					if(err){
						throw err;
					}else{
						Lojas.findOne({_id: req.body.propriedade}, function(err, data2){
							var loja = data2;
							loja.administradores.push(data1._id);

							loja.save(function(err, data3){
								if(err){
									throw err;
								}else{
									res.json(data3);
								}
							});
						});
					}
				});
			}else{
				res.json({err: 1});
			}
		});
	});

	// PEGA DADOS DE UM UNICO USUARIO
	router.get('/usuario/:id', isLoggedIn, function(req, res){
		Usuario.findOne({_id: req.params.id}, function(err, data){
			res.json(data);
		});
	});

	// LOGOUT //
	router.get('/logout', isLoggedIn, function(req, res){
		req.logout();
		res.redirect('/');
	});

	  ///////////////////////////////////////////////
	 //                     BUBBLES               //
	///////////////////////////////////////////////

	// CRIAR UM NOVO BUBBLE //
	router.post('/new-bubble', isLoggedIn, function(req, res){

		Bubble.findOne({'dados.appname': req.body.dados.appname}, function(err, data){
			// Appname nao encontrado, entao nao existe
			// Deverá e será unico
			if(!data){
				var novoBubble   = new Bubble();
				novoBubble.dados = req.body.dados;
				novoBubble.administradores.push(req.user._id);

				novoBubble.save(function(err, data){
					if(err){
						throw err;
					}else{

						var propriedadeUsuario = req.user;
						propriedadeUsuario.propriedades.push(data._id);

						propriedadeUsuario.save(function(err){
							if(err){
								throw err;
							}else{
								res.json(data);
							}
						});
					}
				});
			}else{
				// Appname encontrado
				res.json({err: true});
			}
		});
	});

	// EDITAR UMA LOJA //
	router.post('/bubbles/:id', isLoggedIn, function(req, res){
		Bubble.findOne({_id: req.params.id}, function(err, data){
			
			var bubble               = data;
			bubble.dados.nome 	     = req.body.dados.nome;
			bubble.dados.ramo        = req.body.dados.ramo;
			bubble.dados.idCriador   = req.body.dados.idCriador;
			bubble.dados.dtCadastro  = new Date();

			bubble.save(function(err, data){
				if(err){
					throw err;
				}else{
					res.json(data);
				}
			});
		});
	});

	// LISTAR UM CHAT //
	router.get('/bubbles/:appname', isLoggedIn, function(req, res){
		Bubble.findOne({'dados.appname': req.params.appname}, function(err, data){
			
			res.json(data);

			var namespace = io.of('/' + req.params.appname);
			namespace.on('connection', function (socket) {
				console.log('==================================================================')
				// Transmitir a todos que usuario entrou na propriedade
				socket.emit('conectado', {nome: req.user.nome});
			});
		});
	});

	//EXCLUIR UM CHAT //
	router.delete('/bubbles/:id', isLoggedIn, function(req, res){
		Bubble.remove({_id: req.params.id}, function(err){
			res.json({result: err ? 'error' : 'ok'});
		});
	});

	// LISTAR TODAS OS CHATS DO USUARIO LOGADO //
	router.get('/bubbles', isLoggedIn, function(req, res){
		Bubble.find({_id: { $in: req.user.propriedades.map(function(o){ return mongoose.Types.ObjectId(o); })}}, function(err, data){
			res.json(data);
		});
	});
};

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
};