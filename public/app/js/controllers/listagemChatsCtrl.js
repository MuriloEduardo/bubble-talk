app.controller('listagemChatsCtrl', function($scope, $rootScope, allChats, $location){

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = false;

	// Todos os chats deste usuario logado
	$scope.allChats = allChats.data;

	$scope.openChat = function(appname){
		$location.path('/app/' + appname);
	};
});