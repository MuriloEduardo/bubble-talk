app.config(function ($routeProvider, $locationProvider) {
    
    $routeProvider
    
    .when('/', {
        templateUrl: 'views/listagem-chats.html',
        controller: 'listagemChatsCtrl'
    })

    .when('/new-bubble', {
        templateUrl: 'views/new-bubble.html',
        controller: 'newBubbleCtrl'
    })

    .when('/sua-conta', {
        templateUrl: 'views/sua-conta.html',
        controller: 'suaContaCtrl'
    })

    .when('/:app_id', {
        templateUrl: 'views/dashboard.html',
        controller: 'dashboardCtrl'
    })

    .when('/:app_id/bubble', {
        templateUrl: 'views/bubble.html',
        controller: 'bubbleCtrl'
    })

    .when('/:app_id/equipe', {
        templateUrl: 'views/equipe.html',
        controller: 'equipeCtrl',
        resolve: {
            bubble: function (Api, $route, $location){
                Api.getBubble($route.current.params.app_id).success(function(data){ if(!data) $location.path('/') });
                return Api.getBubble($route.current.params.app_id);
            }
        }
    })

    .otherwise({redirectTo: '/'});

    $locationProvider.html5Mode({enabled: true, requireBase: false});
});