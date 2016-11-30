app.controller('bubbleCtrl', function($scope, $rootScope, $timeout, bubble, Notification, $routeParams, $filter, $window, ngAudio){

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = true;

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews(false);

	var socket = io.connect('http://127.0.0.1:4000/');

	$scope.bubble 	 = bubble.data;
	$scope.conversa  = {};
	$scope.conversas = [];

	if(bubble.data.conversas.length) {
		for (var i = 0; i < bubble.data.conversas.length; i++) {
			if(bubble.data.conversas[i].mensagens.length) {
				bubble.data.conversas[i].canal_atual = bubble.data._id;
				$scope.conversas.push(bubble.data.conversas[i]);
			}
		}
	}

	if($rootScope.user.conversas.length) {
		for (var i = 0; i < $rootScope.user.conversas.length; i++) {
			if($rootScope.user.conversas[i].mensagens.length) {
				$rootScope.user.conversas[i].canal_atual = $rootScope.user._id;
				$scope.conversas.push($rootScope.user.conversas[i]);
			}
		}
	}

	$scope.administrador = {
		canal_atual: $rootScope.user._id,
		bubble_id: bubble.data._id,
		socket_id: $rootScope.user._id
	}

	var sound_msg = ngAudio.load('../sounds/web-tone.mp3');

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

	$timeout(function(){
		$scope.$broadcast('rebuild:conversas');
	});

	var scrollBottom = function() {
		$scope.safeApply(function() {
			$scope.$broadcast('rebuild:messages');
			$scope.$broadcast('rebuild:conversas');
	    });
	}

	$scope.dadosCliente = function() {
    	if(!$scope.dadosClienteToggle) {
    		$scope.dadosClienteToggle = true;
    	} else {
    		$scope.dadosClienteToggle = false;
    	}
    }

    $scope.ultimaMsg = function(data) {
    	return data.mensagens[data.mensagens.length-1];
    }

    var checkFocus = function() {
    	return document.hasFocus();
    }

    $scope.naoVisualizadas = function(cliente) {
    	var m = $filter('filter')($scope.conversas, {socket_id: cliente.socket_id, canal_atual:cliente.canal_atual}, true)[0];
    	var t = m.mensagens.filter(function(i) {return !i.visulizada&&!i.remetente;});
    	return t.length;
    }

    var displayVisualiza = function() {
    	var m = $filter('filter')($scope.conversas, {socket_id: $scope.administrador.cliente_socket_id, canal_atual: $scope.administrador.canal_atual}, true)[0];
		if(m) {
			for (var i = 0; i < m.mensagens.length; i++) {
				if(!m.mensagens[i].remetente) {
					$scope.safeApply(function() {
						m.mensagens[i].visulizada = true;
			        });
				}
			}
		}
    }

	socket.on('connect', function() {

		// Real Time Notify
		socket.emit('novo administrador', $scope.administrador);

		socket.on('usuarios', function(data) {
			if(data.socket_id == $scope.administrador.socket_id) return false;
			var u = $filter('filter')($scope.conversas, {socket_id: data.socket_id}, true)[0];
			if(u) u.connected = data.connected;
		});

		$window.onfocus = function(){
			if($scope.administrador.cliente_socket_id && $scope.administrador.cliente_socket_id==$scope.conversa.socket_id) {
				$timeout(function(){
					visualizar();
					scrollBottom();
					displayVisualiza();
				});
			}
		}

		$scope.enviaMsg = function(mensagem) {
			
			var send_mensagem = {
				mensagem: mensagem,
				remetente: true,
				visulizada: false,
				data: new Date()
			}

			$scope.administrador.cliente_socket_id = $scope.conversa.socket_id;
			$scope.administrador.mensagem = send_mensagem;

			socket.emit('sent:mensagem', $scope.administrador);

			// Deixa o text area em branco novamente
			$scope.message = undefined;
		}

		socket.on('change:particular', function(data) {
			if($scope.administrador.socket_id != data.administrador.socket_id) {
				var index = $scope.conversas.indexOf(data.cliente);
				$scope.conversas.splice(index,1);
			}
		});

		$scope.trocarCliente = function(cliente) {
			var m = $filter('filter')($scope.conversas, {socket_id: cliente.socket_id}, true);
			if(m.length>1) {
				var cliente = $filter('filter')(m, {socket_id: cliente.socket_id}, true)[0];
				console.log(x)
				for (var i = 0; i < m[1].mensagens.length; i++) {
					m[0].mensagens.push(m[1].mensagens[i]);
				}
				cliente = {
					bubble_id: m[0].bubble_id,
					digitando: m[0].digitando,
					mensagens: m[0].mensagens,
					socket_id: m[0].socket_id,
					canal_atual: m[1].canal_atual
				};
				var index = $scope.conversas.indexOf(m[1]);
				if(index>=0) $scope.conversas.splice(index,1);
			}
			if(cliente.canal_atual == cliente.bubble_id) {
				socket.emit('change:particular', {cliente:cliente,administrador:$scope.administrador});
				cliente.canal_atual = $scope.administrador.socket_id;
			}
			$scope.safeApply(function() {
				$scope.textareaBody = true;
				$scope.conversa = cliente;
				$scope.administrador.cliente_socket_id = cliente.socket_id;
			});
			$timeout(function(){
				visualizar();
				scrollBottom();
				displayVisualiza();
			});
		}

		var visualizar = function() {
			socket.emit('visualizar', {usuario:$scope.administrador,conversa:$scope.conversa});
		}

		socket.on('nova mensagem', function(data) {
			$timeout(function(){
				if(!checkFocus()) {
					sound_msg.paused ? sound_msg.play() : sound_msg.restart()
				}
			});
			var _id = data.cliente_socket_id ? data.cliente_socket_id : data.socket_id;
			var m = $filter('filter')($scope.conversas, {socket_id: _id, canal_atual: data.canal_atual}, true)[0];
			if(m) {
				$scope.safeApply(function() {
					// Conversa ja existia no banco
					// So continuar dando push
					m.mensagens.push(data.mensagem);
				});
			} else {
				$scope.safeApply(function() {
					// Nova conversa
					$scope.conversas.push({
						bubble_id: data.bubble_id,
						canal_atual: data.canal_atual,
						socket_id: data.socket_id,
						mensagens: [data.mensagem]
					});
				});
			}
			scrollBottom();
		});

		$scope.typing = function() {
			$scope.administrador.digitando = $scope.message ? true : false;
		}

		$scope.$watch('administrador.digitando', function() {
			socket.emit('digitando', $scope.administrador);
		});

		socket.on('trocou canal', function(canal) {
			$scope.safeApply(function() {
				$scope.administrador.canal_atual = canal;
	        });
		});

		socket.on('digitando', function(data) {
			var m = $filter('filter')($scope.conversas, {socket_id: data.socket_id,canal_atual:data.canal_atual}, true)[0];
			$scope.safeApply(function() {
				if(m) m.digitando = data.digitando;
			});
		});

		socket.on('visualizou', function(data) {
			if($scope.administrador.cliente_socket_id) {
				if($scope.administrador.cliente_socket_id==$scope.conversa.socket_id) {
					for (var i = 0; i < $scope.conversa.mensagens.length; i++) {
						if($scope.conversa.mensagens[i].remetente) {
							$scope.safeApply(function() {
								$scope.conversa.mensagens[i].visulizada = true;
					        });
						}
					}
				} else {
					displayVisualiza();
				}
			}
		});
	});
});