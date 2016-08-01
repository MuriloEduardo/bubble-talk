app.config(function ($routeProvider, $locationProvider) {
    
    $routeProvider
    
    .when('/app/', {
        templateUrl: 'views/listagem-chats.html',
        controller: 'listagemChatsCtrl',
        resolve: {
            AllBubbles: function(Api) {
                return Api.getAllBubbles();
            }
        }
    })

    .when('/app/new-bubble', {
        templateUrl: 'views/new-bubble.html',
        controller: 'newBubbleCtrl'
    })

    .otherwise({redirectTo: '/app'});

    $locationProvider.html5Mode({enabled: true, requireBase: false});
});