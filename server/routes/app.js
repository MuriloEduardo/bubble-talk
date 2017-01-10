var isLoggedIn = require('../models/isLoggedIn');
module.exports = function(router){
	
	// Public           //
	/////////////////////
	
	// Home - One Page //
	router.get('/', function(req, res){
		res.render('./index.ejs');
	});
	
	// Login
	router.get('/login', function(req, res){
		res.render('./login.ejs', {message_login: req.flash('loginAviso')});
	});
	
	// Confirmação
	// Convido para ser administrador receberá link para cá
	// para cadastrar sua senha
	// @param id client sem senha
	router.get('/confirmacao/:id', function(req, res){
		res.render('./confirmacao.ejs', {id: req.params.id});
	});
	
	// Landing
	router.get('/experimente-gratis', function(req, res){
		res.render('./cadastrar.ejs', {message_cadastrar: req.flash('cadastrarAviso')});
	});
	
	// Volte Sempre
	router.get('/volte-sempre', function(req, res){
		res.render('./volte-sempre.ejs');
	});
	
	// ADMIN        //
	/////////////////
	
	router.get('/app/:app_id?/:partial?', isLoggedIn, function(req, res){
		res.render('./../app/index.ejs');
	});
};