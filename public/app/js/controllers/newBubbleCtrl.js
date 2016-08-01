app.controller('newBubbleCtrl', ['$scope', '$rootScope', 'Api', function($scope, $rootScope, Api){
	$scope.cadastro = function(obj) {
		Api.createBubble(obj).success(function(resposta){
			console.log(resposta)
		}).error(function(err){
			console.error(err)
		})
	}
}]);