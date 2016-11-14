app.controller('mainCtrl', function($scope, $rootScope, $location, $routeParams){

	// Abre e fecha menu esquerdo
	$('#toggleMenu').click(function(){
		$('#wrapper').toggleClass('toggledmenuleft');
	});

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = false;

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews = function(status) {

		var i = (status) ? 'show' : 'hide';

		$('#load-modal').modal(i);
	}

	// Método responsavel por carregar na variavel "user"
	// todos os dados do usuario vindo do passport
	$scope.loadUser = function(user) {

		user = JSON.parse(user);

		// Variavel com todos os dados do usuario
		$rootScope.user = user;

		// Se usuario for convidado
		// Manda para tela de perfil para ser cadastrado informações minimas
		if(!user.nome) $rootScope.go('sua-conta');
	}

	// Navega entre as pages depois do appname
	$scope.goInternalPages = function(destino) {
		// Exibir load
		$rootScope.loadViews(true);

		$location.path('/' + $routeParams.app_id + '/' + destino);
	}

	$rootScope.go = function(destino) {
		// Exibir load
		$rootScope.loadViews(true);

		$location.path(destino);
	}

	// Define qual item do meu o suario esta
	// SOmente para urls depois do nome do aplicativo
	$scope.isActive = function (path) {
		return ($location.path().split('/')[2] === path) ? 'active' : '';
	}

	// Retornar para view somente o primeiro nome
	$scope.firstName = function(user) {
		if(user.nome)
			return user.nome;
		else
			return user.local.email.split('@')[0];
	}
});