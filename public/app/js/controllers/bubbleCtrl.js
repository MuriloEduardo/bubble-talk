app.controller('bubbleCtrl', function($scope, $rootScope, bubble, Notification, $routeParams){

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = true;

	// Dados do chat carregado no scope
	// Utilizar o maximo em memoria
	$scope.chat = bubble.data;

	// Conecta-se com o namespace do appname do chat
	var socket = io('/' + $routeParams.appname);

	// Recebe evento do Servidor
	socket.on('conectado', function (data) {
		Notification.primary('Administrador ' + data.nome + ', se juntou a nós!');
	});
});