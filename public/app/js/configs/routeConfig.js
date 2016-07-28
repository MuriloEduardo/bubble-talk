app.config(function ($routeProvider, $locationProvider) {
    
    $routeProvider
    
    .when('/app/', {
        templateUrl: 'views/listagem-chats.html',
        controller: 'listagemChatsCtrl'
    })

    .otherwise({redirectTo: '/app'});

    $locationProvider.html5Mode({enabled: true, requireBase: false});
});