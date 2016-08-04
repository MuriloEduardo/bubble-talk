app.config(function ($routeProvider, $locationProvider) {
    
    $routeProvider
    
    .when('/', {
        templateUrl: 'views/listagem-chats.html',
        controller: 'listagemChatsCtrl',
        resolve: {
            allChats: function (Api){
                return Api.AllChats();
            }
        }
    })

    .when('/new-bubble', {
        templateUrl: 'views/new-bubble.html',
        controller: 'newBubbleCtrl'
    })

    .when('/sua-conta', {
        templateUrl: 'views/sua-conta.html',
        controller: 'suaContaCtrl'
    })

    .when('/:appname', {
        templateUrl: 'views/bubble.html',
        controller: 'bubbleCtrl',
        resolve: {
            bubble: function (Api, $route, $location){
                Api.getBubble($route.current.params.appname).success(function(data){ if(!data) $location.path('/') });
                return Api.getBubble($route.current.params.appname);
            }
        }
    })

    .when('/:appname/equipe', {
        templateUrl: 'views/equipe.html',
        controller: 'equipeCtrl',
        resolve: {
            bubble: function (Api, $route, $location){
                Api.getBubble($route.current.params.appname).success(function(data){ if(!data) $location.path('/') });
                return Api.getBubble($route.current.params.appname);
            }
        }
    })

    .otherwise({redirectTo: '/'});

    $locationProvider.html5Mode({enabled: true, requireBase: false});
});