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

    .when('/app/:appname', {
        templateUrl: 'views/bubble.html',
        controller: 'bubbleCtrl',
        resolve: {
            bubble: function (Api, $route){
                return Api.getBubble($route.current.params.appname);
            }
        }
    })

    .when('/app/:appname/equipe', {
        templateUrl: 'views/equipe.html',
        controller: 'bubbleCtrl'
    })

    .otherwise({redirectTo: '/app'});

    $locationProvider.html5Mode({enabled: true, requireBase: false});
});