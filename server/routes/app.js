var isLoggedIn = require('../models/isLoggedIn');
module.exports = function(router){
	router.get('/app/:app_id?/:partial?/:partial?', isLoggedIn, function(req, res){
		res.render('./../app/index.ejs');
	});
};