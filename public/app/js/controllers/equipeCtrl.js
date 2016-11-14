app.controller('equipeCtrl', function($scope, $rootScope, Api, Notification, bubble){

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = true;

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews(false);

	// Load de envio do email
	$scope.loadNewAdm = false;

	$scope.equipe = bubble.data.administradores;
	
	$scope.newAdm = function(user) {
		if(user){
			$scope.loadNewAdm = true;
			var dadosSend = {
				local: user.local,
				id_bubble: bubble.data._id
			}
			Api.newAdm(dadosSend).success(function(data) {
				$scope.equipe.push(data);
				Notification.success('Administrador cadastrado com sucesso! Ele receberá um email, lembre-o.');
				$scope.loadNewAdm = false;
			}).error(function(err) {
				console.error(err)
			});
		}
	}
});