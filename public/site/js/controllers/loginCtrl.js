app.controller('loginCtrl', function($scope){
	
	// Focus no input ao entrar na página
	$('input[type="email"]').focus();

	// Determina se usuario ja clicou para se logar ou não
	// Responsavel por ações do load
	$scope.sended = false;

	// Recebe mensagens sobre o login do servidor
	$scope.loadMsgLogin = function(msg) {
		if(msg.length){
			$scope.message_login = msg;
		}
	}
});