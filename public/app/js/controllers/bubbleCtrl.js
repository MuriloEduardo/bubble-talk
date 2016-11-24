app.controller('bubbleCtrl', function($scope, $rootScope, $timeout, bubble, Notification, $routeParams, $filter, $window){

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

	var scrollBottom = function() {
		$scope.$broadcast('rebuild:messages');
	}

	$scope.dadosCliente = function() {
    	if(!$scope.dadosClienteToggle)
    		$scope.dadosClienteToggle = true;
    	else
    		$scope.dadosClienteToggle = false;
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
		for (var i = 0; i < m.mensagens.length; i++) {
			if(!m.mensagens[i].remetente) {
				$scope.safeApply(function() {
					m.mensagens[i].visulizada = true;
		        });
			}
		}
    }

	socket.on('connect', function() {

		// Real Time Notify
		socket.emit('novo administrador', $scope.administrador);

		socket.on('usuarios', function(data) {

			/*for (var i = 0; i < data.length; i++) {
				
				for (var x = 0; x < $scope.clientes.length; x++) {
				
					if($scope.clientes[x].client_socket_id == data[i].id) {
						$scope.clientes[x].client_online = data[i].connected;
						$scope.clientes[x].visto_ultimo = data[i].ultima_visulizacao;
					}
				}

				if($scope.administrador.client_socket_id == data[i].id) {
					
					$scope.safeApply(function() {
						$scope.administrador.client_online = data[i].connected;
						$scope.administrador.visto_ultimo = data[i].ultima_visulizacao;
			        });
				}
			}*/
		});

		$window.onfocus = function(){
			if($scope.administrador.cliente_socket_id && $scope.administrador.cliente_socket_id==$scope.conversa.socket_id) {
				$timeout(function(){
					visualizar();
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
			if($scope.administrador.socket_id != data.socket_id) {
				$scope.safeApply(function() {
					$scope.conversas = $scope.conversas.filter(function(i) { 
						return i.socket_id !== data.socket_id;
					});
				});
			}
		});

		$scope.trocarCliente = function(cliente) {
			$scope.safeApply(function() {
				// Sai da primeira tela
				// Onde foi a primeira vez que entrou no Adm
				// nao clicou em nenhum conversa
				$scope.textareaBody = true;
				$scope.conversa = cliente;
				$scope.administrador.cliente_socket_id = cliente.socket_id;
			});

			if(cliente.canal_atual == $scope.administrador.bubble_id) {
				// Quando o administrador clica nessa conversa sem administrador, deve se tornar sua
				// Copiar mensagens deste id para as conversas deste usuario
				socket.emit('change:particular', {cliente:cliente,administrador:$scope.administrador});
			}

			scrollBottom();

			$timeout(function(){
				visualizar();
				displayVisualiza();
			});
		}

		var visualizar = function() {
			socket.emit('visualizar', {usuario:$scope.administrador,conversa:$scope.conversa});
		}

		socket.on('nova mensagem', function(data) {
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