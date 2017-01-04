app.factory('Api', function($http){

	var _createBubble = function(obj) {
		return $http.post('/api/new-bubble', obj);
	};

	var _getAllChats = function() {
		return $http.get('/api/bubbles');
	};

	var _getBubble = function(app_id) {
		return $http.get('/api/bubbles/' + app_id);
	}

	var _newAdm = function(user) {
		return $http.post('/api/new-adm', user);	
	}
	
	var _getAdm = function() {
		return $http.get('/api/current-user');	
	}

	return {
		createBubble: _createBubble,
		AllChats: _getAllChats,
		getBubble: _getBubble,
		newAdm: _newAdm,
		getAdm: _getAdm
	};
});