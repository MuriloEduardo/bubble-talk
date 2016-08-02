app.controller('newBubbleCtrl', function($scope, Api, Notification){
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