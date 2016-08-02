app.controller('bubbleCtrl', function($scope, $rootScope, bubble, Notification, $routeParams, $location){

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = true;

	// Dados do chat carregado no scope
	// Utilizar o maximo em memoria
	if(bubble.data)
		$rootScope.chat = bubble.data;
	else
		$location.path('/app/');

	// Conecta-se com o namespace do _id da loja
	var socket = io('/' + $routeParams.appname);
	
	// Envia evento para Socket
	socket.emit('administrador-entrou', $rootScope.user);

	// Recebe evento do Servidor
	socket.on('aviso-administrador-entrou', function (data) {
		Notification.primary('Administrador ' + data.nome + ', se juntou a nós!');
	});
});