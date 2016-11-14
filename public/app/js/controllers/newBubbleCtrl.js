app.controller('newBubbleCtrl', function($rootScope, $scope, Api, Notification){

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews(false);
	
	$scope.cadastro = function(obj) {
		
		obj.dados.appname = obj.dados.appname.replace(/ /g, '-');

		Api.createBubble(obj).success(function(resposta){
			if(resposta.err){
				// Appname ja existe
				Notification.error('Nome do chat já existente');
			}else{
				// Cadastrado com sucesso
				Notification.success('Chat criado com sucesso');
			}
		}).error(function(err){
			console.error(err)
		})
	}
});