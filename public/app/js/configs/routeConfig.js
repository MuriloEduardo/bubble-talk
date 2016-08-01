app.config(function ($routeProvider, $locationProvider) {
    
    $routeProvider
    
    .when('/app/', {
        templateUrl: 'views/listagem-chats.html',
        controller: 'listagemChatsCtrl',
        resolve: {
            allChats: function (Api){
                return Api.AllChats();
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