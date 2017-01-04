var Usuario 	  = require('../models/usuario');
var Bubble        = require('../models/bubble');
var mongoose 	  = require('mongoose');
var nodemailer    = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var isLoggedIn    = require('../models/isLoggedIn');
var path 		  = require('path');

var conta = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'muriloeduardoooooo@gmail.com',
        pass: 'liloeduardo0202'
    }
});


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
	}),function(req, res) {
		console.log('req.body')
		console.log(req.body)
		return
		if (req.body.remember) {
			req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
		} else {
			req.session.cookie.expires = false; // Cookie expires at end of session
		}
		res.redirect('/');
	});
	
	// LISTAR USUARIO LOGADO //
	router.get('/current-user', isLoggedIn, function(req, res){
		res.json(req.user);
	});

	// CRIAR NOVO ADMINISTRADOR //
	router.post('/new-adm', isLoggedIn, function(req, res){
		
		Usuario.findOne({'local.email': req.body.local.email}, function(err, user){
			if(!user){
				var novoAdm = new Usuario();
				novoAdm.local = req.body.local;
				novoAdm.bubbles.push(req.body.id_bubble);

				novoAdm.save(function(err, data1){
					if(err){
						throw err;
					}else{
						Bubble.findOne({_id: req.body.id_bubble}, function(err, data2){
							var bubble = data2;
							bubble.administradores.push(data1._id);

							bubble.save(function(err, data3){
								if(err){
									throw err;
								}else{

									conta.sendMail({
										from: 'Bubble Talk <muriloeduardoooooo@gmail.com>',
										to: 'Murilo Santinhos <muriloeduardoooooo@gmail.com>',
										subject: 'Parabéns! Você foi convidado para se tornar um membro de equipe',
										html: '<table width="600px" cellspacing="0" cellpadding="30" border="0" style="margin:auto;"><tr><td width="100%" height="300px" bgcolor="#00f2d4" valign="top" style="color:#fff;"><h2 style="font-size:2em;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;">Convite para voc&ecirc; se tornar um membro da equipe ' + data2.dados.appname + '</h2><p style="text-align:center;margin-top:80px;"><a href="http://127.0.0.1:10/confirmacao/' + data1._id + '" style="text-decoration:none;padding:15px 30px;border-radius:30px;background-color:#fff;color:#00f2d4;text-align:center;cursor:pointer;font-size:22px;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;"><b>Cadastrar sua nova senha</b></a></p></td></tr><tr><td width="100%" height="200px" bgcolor="#fbfbfb" valign="top"><h1 style="color:#555;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;">Por que estou recebendo este email?</h1><p style="color:#555;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;">Algum administrador lhe enviou um convite para se tornar um membro da equipe do chat ' + data2.dados.appname + '.</p><p style="text-align:center;margin:60px 0 20px 0;"><a href="#" style="text-decoration:none;padding:15px;border-radius:30px;background-color:#00f2d4;color:#fff;text-align:center;cursor:pointer;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;"><b>D&uacute;vidas? Clique aqui</b></a></p></td></tr><tr><td width="100%" bgcolor="#f1f1f1" valign="top"><p style="text-align:center;color:#555;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;">Fique tranquilo, tamb&eacute;m odiamos spam :)</p></td></tr></table>'
									}, function(err){
										if(err)
											throw err;
									});

									res.json(data1);
								}
							});
						});
					}
				});
			}else{
				res.json(user);
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
		res.redirect('/volte-sempre');
	});

	router.put('/confirmacao', function(req, res){
		Usuario.findOne({_id: req.body.id}, function(err, data){
			if(!data){
				// Id da url nao encontrado
				res.json({res: 404});
			}else if(data.local.senha){
				// Senha ja cadastrada
				res.json({res: false});
			} else{
				var newUser = data;
				newUser.local = {
					email: data.local.email, 
					senha: Usuario().generateHash(req.body.senha)
				};

				newUser.save(function(err, data2){
					if(err){
						throw err;
					}else{
						// Efetuar login
						res.json({res: data2});
					}
				});
			}
		});
	});

	// EDITAR UM USUARIO //
	router.post('/usuario/:id', isLoggedIn, function(req, res){
		Usuario.findOne({_id: req.params.id}, function(err, data){

			var usuario         = data;
			usuario.nome        = req.body.nome;
			usuario.local.email = req.body.local.email;
			
			if(req.body.local.senha)
				usuario.local.senha = usuario.generateHash(req.body.local.senha);

			usuario.save(function(err, data){
				if(err){
					throw err;
				}else{
					res.json(data);
				}
			});
		});
	});

	///////////////////////////////////////////////
	//                   BUBBLES                 //
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
				novoBubble.criador = req.user._id;

				novoBubble.save(function(err, data){
					if(err){
						throw err;
					}else{

						var propriedadeUsuario = req.user;
						propriedadeUsuario.bubbles.push(data._id);

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

	// EDITAR UM BUBBLE //
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

	// LISTAR UM BUBBLE //
	router.get('/bubbles/:app_id', isLoggedIn, function(req, res){

		Bubble.findOne({'_id': req.params.app_id}, function(err, data1){

			Usuario.find({_id: { $in: data1.administradores.map(function(o){ return mongoose.Types.ObjectId(o); })}}, function(err, data2){
				
				data1.administradores = data2;

				res.json(data1);
			});
		});
	});

	//EXCLUIR UM BUBBLE //
	router.delete('/bubbles/:id', isLoggedIn, function(req, res){
		Bubble.remove({_id: req.params.id}, function(err){
			res.json({result: err ? 'error' : 'ok'});
		});
	});

	// LISTAR TODAS OS BUBBLES DO USUARIO LOGADO //
	router.get('/bubbles', isLoggedIn, function(req, res){
		Bubble.find({_id: { $in: req.user.bubbles.map(function(o){ return mongoose.Types.ObjectId(o); })}}, function(err, data){
			res.json(data);
		});
	});
};