app.controller('confirmacaoCtrl', function($scope, $http){
	
	// Focus no input ao entrar na página
	$('input[type="password"]').focus();

	// Determina se usuario ja clicou para se logar ou não
	// Responsavel por ações do load
	$scope.sended = false;

	$scope.sendConfirmacao = function(dados) {
		$scope.message_success = undefined;
		$scope.message_error   = undefined;
		$scope.message_primary = undefined;

		$scope.sended = true;
		dados = {id: $scope.idUser, senha: dados.senha};

		$http.put('/api/confirmacao', dados).success(function(data){
			$scope.sended = false;
			if(data.res&&data.res!=404){
				$scope.message_success = '<strong>Sua senha foi cadastrada!</strong> Você será redirecionado.';
				
				// Efetuará o login automaticamente
				var dadosLogin = {
					email: data.res.local.email,
					senha: dados.senha
				}
				$http.post('/api/login', dadosLogin).success(function(data){
					if(data)
						window.location = '/app';
				})
			}else if(data.res===404){
				// Id da url nao encontrado
				$scope.message_error = '<strong>Você não foi convidado a administrar nenhum chat.</strong> Gostaria de criar um para voce? <a href="/experimente-gratis" class="alert-click">Clique aqui</a>'
			}else if(!data.res){
				// Senha ja cadastrada para este email
				$scope.message_primary = '<strong>Você já cadastrou uma senha!</strong> Para fazer o login <a href="/login" class="alert-click">clique aqui</a>'
			}
		}).error(function(err){
			console.error(err)
		})
	}
});