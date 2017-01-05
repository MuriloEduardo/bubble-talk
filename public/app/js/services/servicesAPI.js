app.factory('Api', function($http, $location){

	var _createBubble = function(obj) {
		return $http.post('/api/new-bubble', obj);
	};

	var _getAllChats = function() {
		return $http.get('/api/bubbles');
	};

	var _getBubble = function(app_id) {
		var ret = $http.get('/api/bubbles/' + app_id);
		ret.success(function(res){
			if(res.err==-1) {
				// Aplicação nao encontrada
				$location.path('/');
				return false;
			}
		});
		return ret;
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