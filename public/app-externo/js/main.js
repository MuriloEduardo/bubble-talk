$(window).ready(function(){
	$('body').append('<div id="bubbleApp"></div>').promise().done(function(){
		writeDependecies(['']);
    });
})