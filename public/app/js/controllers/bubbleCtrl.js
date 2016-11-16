app.controller('bubbleCtrl', function($scope, $rootScope, $timeout, bubble, Notification, $routeParams, $filter, $window){

	// Variavel Scope root responsavel por informar se 
	// Menu a esquerda e seus botoes controladores
	// Aparecerão ou não
	$rootScope.menuLeft = true;

	// Mostrar ou não load de carregamento das views
	// Será ativada ao clicar para trocar
	// E escondida quando chegar em outro controller
	$rootScope.loadViews(false);

	// Dados do chat carregado no scope
	// Utilizar o maximo em memoria
	$scope.chat = bubble.data;

	var socket = io.connect('http://127.0.0.1:4000/');

	$scope.messages = [];
	$scope.clientes = [];
	$scope.equipe = [];

	$scope.digitando = false;

	$scope.infosAdm = {
		canal_atual: $scope.chat._id,
		bubble_id: $scope.chat._id,
		nome: $rootScope.user.nome,
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

    var checkFocus = function() {
    	return document.hasFocus();
    }

	socket.on('connect', function() {

		// Real Time Notify
		socket.emit('novo usuario', $scope.infosAdm);

		socket.on('usuarios', function(data) {
			for (var i = 0; i < data.length; i++) {
				for (var x = 0; x < $scope.clientes.length; x++) {
					if($scope.clientes[x].client_socket_id == data[i].id) {
						$scope.clientes[x].client_online = data[i].connected;
					}
				}
			}
		});

		var displayMsg = function(data) {

			$scope.safeApply(function() {
				$scope.messages.push(data);
	        });

	        if(!data.remetente) {
	        	// Cliente enviando para administrador
		        
		        var cliente = $filter('filter')($scope.clientes, {client_socket_id: data.socket_id}, true)[0];

		        if(!cliente) {
		        	// Não existe
		        	// Solicitou falar no chat pela 
		        	// primeira vez
		        	$scope.safeApply(function() {
						$scope.clientes.push({
			        		canal: data.canal,
			        		client_socket_id: data.socket_id
			        	});
			        });
		        }

		        for (var i = 0; i < $scope.messages.length; i++) {
		        	if(cliente) {
						if(!$scope.messages[i].visualizado) {
							$scope.safeApply(function() {
								typeof cliente.nao_visulizadas === "undefined" ? cliente.nao_visulizadas = 1 : cliente.nao_visulizadas = cliente.nao_visulizadas + 1;
							});
						}
						if($scope.messages[i].client_socket_id == cliente.client_socket_id) {
							cliente.ultima_msg = $scope.messages[i];
						}
					}
				}

				if($scope.infosAdm.client_socket_id == data.socket_id && checkFocus()) {
					// Administrador esta com o focus na janela, ou seja:
					// esta visualizando a aplicação
					// E também
					// Administrador esta com a conversa deste cliente que o chamou
					// portanto então, a mensagem é considerada visulizada
					for (var i = 0; i < $scope.messages.length; i++) {
						if($scope.messages[i].socket_id == $scope.infosAdm.client_socket_id) {
							$scope.messages[i].visualizado = true;
						}
					}

					var mensagens = $filter('filter')($scope.messages, {socket_id: $scope.infosAdm.client_socket_id}, true);

					$scope.safeApply(function() {
						$scope.infosAdm.conversas = [];
						$scope.infosAdm.conversas = angular.fromJson(angular.toJson(mensagens));
					});

					$timeout(function() {
						visualizar($scope.infosAdm);
					});
				}
	    	}

	    	if(data.client_socket_id == $scope.infosAdm.client_socket_id) {
				$scope.infosAdm.ultima_msg = data.criado;
				console.log($scope.infosAdm)
			}

	        scrollBottom();
		}

		$window.onfocus = function(){
			
			if($scope.infosAdm.client_socket_id) {

				for (var i = 0; i < $scope.messages.length; i++) {
					if($scope.messages[i].socket_id == $scope.infosAdm.client_socket_id) {
						$scope.messages[i].visualizado = true;
					}
				}

				var mensagens = $filter('filter')($scope.messages, {socket_id: $scope.infosAdm.client_socket_id}, true);

				$scope.safeApply(function() {
					$scope.infosAdm.conversas = [];
					$scope.infosAdm.conversas = angular.fromJson(angular.toJson(mensagens));
				});

				$timeout(function() {
					visualizar($scope.infosAdm);
				});
			}
		}

		$scope.enviaMsg = function(mensagem) {
			
			var send_mensagem = {
				msg: mensagem, 
				socket_id: $scope.infosAdm.socket_id, 
				canal: $scope.infosAdm.canal_atual,
				bubble_id: $scope.infosAdm.bubble_id,
				client_socket_id: $scope.infosAdm.client_socket_id,
				remetente: true
			}

			socket.emit('enviar mensagem', send_mensagem);

			// Deixa o text area em branco novamente
			$scope.message = undefined;
		}

		$scope.trocarCliente = function(cliente) {

			for (var i = 0; i < $scope.messages.length; i++) {
				if($scope.messages[i].socket_id == cliente.client_socket_id) {
					$scope.messages[i]['canal'] = $rootScope.user._id;
					$scope.messages[i].visualizado = true;
				}
			}

			for (var i = 0; i < $scope.clientes.length; i++) {
				if($scope.clientes[i].client_socket_id == cliente.client_socket_id) {
					$scope.clientes[i]['canal'] = $rootScope.user._id;
					if($scope.clientes[i].client_digitando) $scope.infosAdm.client_digitando = $scope.clientes[i].client_digitando;
					if($scope.clientes[i].client_online) $scope.infosAdm.client_online = $scope.clientes[i].client_online;
				}
			}

			var mensagens = $filter('filter')($scope.messages, {socket_id: cliente.client_socket_id}, true);

			$scope.safeApply(function() {
				$scope.infosAdm.client_socket_id = cliente.client_socket_id;
				$scope.infosAdm.canal_atual = $rootScope.user._id;
				$scope.infosAdm.ultima_msg = cliente.ultima_msg.criado;
				$scope.infosAdm.conversas = [];
				$scope.infosAdm.conversas = angular.fromJson(angular.toJson(mensagens));
			});

			// Quando o administrador clica nessa conversa sem administrador, deve se tornar sua
			// Copiar mensagens deste id para as conversas deste usuario
			socket.emit('tornar minha', $scope.infosAdm);

			visualizar($scope.infosAdm);

			scrollBottom();

			// Sai da primeira tela
			// Onde foi a primeira vez que entrou no Adm
			// nao clicou em nenhum conversa
			$scope.textareaBody = true;
		}

		var visualizar = function(infosAdm) {
			socket.emit('visualizar', infosAdm);
		}

		socket.on('nova mensagem', function(data) {
			displayMsg(data);
		});

		// Recebe os canais de todos os particiapntes
		// da sua equipe
		socket.on('equipe', function(data) {

			for (var i = 0; i < data.length; i++) {

				if(data[i]._id == $rootScope.user._id) {
					for (var x = 0; x < data[i].conversas.length; x++) {
						displayMsg(data[i].conversas[x]);
					}
				} else {
					$scope.safeApply(function() {
			        	$scope.equipe.push(data[i]);
			        });
				}
			}
		});

		$scope.typing = function() {
			$scope.digitando = $scope.message ? true : false;
		}

		$scope.$watch('digitando', function() {
			socket.emit('digitando', {digitando: $scope.digitando, usuario: $scope.infosAdm});
		});

		socket.on('trocou canal', function(canal) {
			// bem vindo ao canal
			$timeout(function () {
				$scope.infosAdm.canal_atual = canal;
	        });
		});

		socket.on('digitando', function(data) {
			
			$scope.safeApply(function() {

				if(data.usuario.socket_id == $scope.infosAdm.client_socket_id) {
					$scope.infosAdm.client_digitando = data.digitando;
				}

				for (var i = 0; i < $scope.clientes.length; i++) {
					if($scope.clientes[i].client_socket_id == data.usuario.socket_id) {
						$scope.clientes[i].client_digitando = data.digitando;
					}
				}
			});
		});

		// Recebe todas as mensagens que não foram pegas para si(respondidas)
		// Mas que ficaram salvas
		socket.on('nao respondidas', function(data) {

			for (var i = 0; i < data.conversas.length; i++) {

				displayMsg(data.conversas[i]);

				var found = $filter('filter')($scope.clientes, {client_socket_id: data.conversas[i].socket_id}, true);

				$scope.safeApply(function() {

					if(!found.length) {
						$scope.clientes.push({
			        		canal: data.conversas[i].canal,
			        		client_socket_id: data.conversas[i].socket_id
			        	});
					}
		        });
			}
		});
	});
});