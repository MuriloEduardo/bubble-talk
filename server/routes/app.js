module.exports = function(router, io){

	router.get('/app/*', isLoggedIn, function(req, res){
		res.render('./../app/index.ejs', {user: JSON.stringify(req.user)});
	});
};

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
};