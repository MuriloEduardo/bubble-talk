app.filter('spaceless',function() {
    return function(input) {
        if (input) {
            return input.replace(/-/g,' ');    
        }
    }
});