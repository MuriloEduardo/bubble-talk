app.controller('mainCtrl', function($scope, $rootScope, $location, $routeParams, $http){

	$scope.safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') {
			if(fn && (typeof(fn) === 'function')) {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};

	// Abre e fecha menu esquerdo
	$('#toggleMenu').click(function(){
		$('#wrapper').toggleClass('toggledmenuleft');
	});

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = false;

	$http.get('/api/bubbles').success(function(res) {
		// Variavel com todos os dados do usuario
		$rootScope.user = res.user;

		// Se usuario for convidado
		// Manda para tela de perfil para ser cadastrado informações minimas
		if(!res.user.nome) $rootScope.go('sua-conta');

		$scope.safeApply(function() {
			$scope.$broadcast('rebuild:menuLeftScroll');
	    });
    });

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews = function(status) {
		$('#load-modal').modal(status?'show':'hide');
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
		if($rootScope.user) {
			if($rootScope.user.nome)
				return $rootScope.user.nome.split(' ')[0];
			else
				return $rootScope.user.local.email.split('@')[0];
		}
	}
});