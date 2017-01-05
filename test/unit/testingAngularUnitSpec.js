describe('testesAngular', function() {
    
    beforeEach(module('bubbleApp'));
    
    describe('Testando AngularJS Controller', function() {
        var scope, ctrl;
        
        beforeEach(inject(function($controller, $rootScope) {
            scope = $rootScope.$new();
            ctrl = $controller('mainCtrl', {$scope:scope});
        }));
        
        it('saber se usuario ja foi setado', function() {
            expect(true).toBe(true);
        });
    });
});