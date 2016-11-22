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
			bubble.data.conversas[i].canal = bubble.data._id;
			$scope.conversas.push(bubble.data.conversas[i]);
		}
	}
	if($rootScope.user.conversas.length) {
		for (var i = 0; i < $rootScope.user.conversas.length; i++) {
			$rootScope.user.conversas[i].canal = $rootScope.user._id;
			$scope.conversas.push($rootScope.user.conversas[i]);
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
			
			if($scope.administrador.client_socket_id) {

				for (var i = 0; i < $scope.messages.length; i++) {
					if($scope.messages[i].socket_id == $scope.administrador.client_socket_id) {
						$scope.messages[i].visualizado = true;
					}
				}

				var mensagens = $filter('filter')($scope.messages, {socket_id: $scope.administrador.client_socket_id}, true);

				$scope.safeApply(function() {
					$scope.administrador.conversas = [];
					$scope.administrador.conversas = angular.fromJson(angular.toJson(mensagens));
				});

				$timeout(function() {
					visualizar();
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

			socket.emit('enviar mensagem', send_mensagem);

			// Deixa o text area em branco novamente
			$scope.message = undefined;
		}

		socket.on('change:particular', function(data) {
			if($scope.administrador.socket_id != data.socket_id) {
				$scope.safeApply(function() {
					$scope.conversas = $scope.conversas.filter(function(i) { 
						console.log(i)
						return i.socket_id !== data.socket_id;
					});
				});
			}
		});

		$scope.trocarCliente = function(cliente) {
			// Sai da primeira tela
			// Onde foi a primeira vez que entrou no Adm
			// nao clicou em nenhum conversa
			$scope.textareaBody = true;

			$scope.conversa = cliente;

			if(cliente.canal_atual == $scope.administrador.bubble_id) {
				// Quando o administrador clica nessa conversa sem administrador, deve se tornar sua
				// Copiar mensagens deste id para as conversas deste usuario
				socket.emit('change:particular', {cliente:cliente,administrador:$scope.administrador});
			}

			scrollBottom();

			$timeout(function() {
				visualizar();
			});
		}

		var visualizar = function() {
			socket.emit('visualizar', $scope.administrador);
		}

		socket.on('nova mensagem', function(data) {
			var m = $filter('filter')($scope.conversas, {socket_id: data.socket_id}, true)[0];
			$scope.safeApply(function() {
				if(m) {
					// Conversa ja existia no banco
					// So continuar dando push
					m.mensagens.push(data.mensagem);
				} else {
					// Nova conversa
					$scope.conversas.push({
						bubble_id: data.bubble_id,
						canal_atual: data.canal_atual,
						socket_id: data.socket_id,
						mensagens: [data.mensagem]
					});
				}
			});
			scrollBottom();
		});

		// Recebe os canais de todos os particiapntes
		// da sua equipe
		/*socket.on('particulares', function(data) {

			for (var i = 0; i < data.length; i++) {

				if(data[i]._id == $rootScope.user._id) {
					displayMsg(data[i]);
				} else {
					$scope.safeApply(function() {
			        	$scope.equipe.push(data[i]);
			        });
				}
			}
		});
		*/

		$scope.typing = function() {
			$scope.digitando = $scope.message ? true : false;
		}

		$scope.$watch('digitando', function() {
			socket.emit('digitando', $scope.administrador);
		});

		socket.on('trocou canal', function(canal) {
			$scope.safeApply(function() {
				$scope.administrador.canal_atual = canal;
	        });
		});

		socket.on('digitando', function(data) {
			var m = $filter('filter')($scope.conversas, {socket_id: data.socket_id}, true)[0];
			$scope.safeApply(function() {
				if(m) m.digitando = data.digitando;
			});
		});
	});
});