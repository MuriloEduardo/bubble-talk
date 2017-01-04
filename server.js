var express      = require('express');
var app          = express();
var http         = require('http');
var server       = http.createServer(app);
var io 			 = require('./server/models/socket').listen(server);
var cookieParser = require('cookie-parser');
var session      = require('express-session');
var morgan       = require('morgan');
var mongoose     = require('mongoose');
var bodyParser   = require('body-parser');
var passport     = require('passport');
var flash        = require('connect-flash');
var path         = require('path');
var api          = express.Router();
var port         = process.env.PORT;
var configDB     = require('./server/config/database');

mongoose.connect(configDB.url, function(err, res) {
	if(err){
		console.info('Nao foi possivel conectar a:' + configDB.url + ' com o erro: ' + err);
	}else{
		console.info('Conectado a ' + configDB.url);
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

// App
require('./server/routes/app')(api);
app.use('/', api);

// API
require('./server/routes/api')(api, passport);
app.use('/api', api);

// Tratamentos de exceção
// ==============================  

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
	console.info('Rodando em ' + port);
});