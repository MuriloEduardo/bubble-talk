app.factory('Api', function($http){

	var _createBubble = function(obj) {
		return $http.post('/api/new-bubble', obj);
	};

	var _getAllBubbles = function() {
		return $http.get('/api/bubbles');
	}

	return {
		createBubble: _createBubble,
		getAllBubbles: _getAllBubbles
	};
});