app.factory('Api', function($resource, $http){

	var _createBubble = function(obj) {
		return $http.post('/api/new-bubble', obj);
	};

	var _getAllChats = function() {
		return $http.get('/api/bubbles');
	};

	return {
		createBubble: _createBubble,
		Bubbles: $resource('/api/bubbles/:id', {id: '@id'}),
		AllChats: _getAllChats
	};
});