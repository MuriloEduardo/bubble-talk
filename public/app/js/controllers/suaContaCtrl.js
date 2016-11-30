app.controller('suaContaCtrl', function($scope, $rootScope, $http, Notification){

	if($rootScope.user) $scope.user.local.senha = '';
	
	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = false;

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews(false);

	$scope.edit = function(user){
		$http.post('/api/usuario/' + $rootScope.user._id, user).success(function(data){
			if(data._id){
				Notification.success('Dados alterados com sucesso!');
			}
		}).error(function(err){
			console.error(err)
		})
	}
});