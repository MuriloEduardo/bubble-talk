app.controller('mainCtrl', function($scope, $rootScope, $location, $routeParams){

	// Abre e fecha menu esquerdo
	$('#toggleMenu').click(function(){
		$('#wrapper').toggleClass('toggledmenuleft');
	});

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = false;

	// Método responsavel por carregar na variavel "user"
	// todos os dados do usuario vindo do passport
	$scope.loadUser = function(user) {
		// Variavel com todos os dados do usuario
		$rootScope.user = JSON.parse(user);
	}

	// Navega entre as pages depois do appname
	$scope.goInternalPages = function(destino) {
		$location.path('/' + $routeParams.appname + '/' + destino);
	}

	// Define qual item do meu o suario esta
	// SOmente para urls depois do nome do aplicativo
	$scope.isActive = function (path) {
		return ($location.path().split('/')[2] === path) ? 'active' : '';
	}
});