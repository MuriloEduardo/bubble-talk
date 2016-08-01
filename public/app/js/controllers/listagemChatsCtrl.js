app.controller('listagemChatsCtrl', ['$scope', '$rootScope', 'AllBubbles', function($scope, $rootScope, AllBubbles){
	console.log(AllBubbles)
	$scope.bubbles = AllBubbles.data;
}]);