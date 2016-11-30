app.controller('listagemChatsCtrl', function($scope, $rootScope, allChats, $location){

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = false;

	// Todos os chats deste usuario logado
	$scope.allChats = allChats.data.bubble;

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews(false);

	$scope.openChat = function(app_id){
		// Exibir load
		$rootScope.loadViews(true);
		
		$location.path('/' + app_id.toLowerCase());
	};
});