app.controller('listagemChatsCtrl', function($scope, $rootScope, $location, AllChats){
	
	$scope.safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest')
			this.$eval(fn);
		else
			this.$apply(fn);
	};
	
	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = false;

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews(false);

	$scope.openChat = function(app){
		// Exibir load
		$rootScope.loadViews(true);
		$location.path('/' + app._id.toLowerCase());
		$scope.safeApply(function(){
			$rootScope.bubble = app;
		});
	};
	
	// Todos os chats deste usuario logado
	$rootScope.allChats = AllChats.data;
});