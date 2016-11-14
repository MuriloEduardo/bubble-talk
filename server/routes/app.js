module.exports = function(router){
	router.get('/app/:app_id?/:partial?/:partial?', isLoggedIn, function(req, res){
		res.render('./../app/index.ejs', {user: JSON.stringify(req.user)});
	});
};

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/login');
};