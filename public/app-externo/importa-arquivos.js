(
	function() {
    writeDependecies([
      'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.8/angular.js',
      'https://code.jquery.com/jquery-3.1.0.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.4.8/socket.io.js',
      'http://127.0.0.1:50/api/jsMain'
    ]);
	}()
);
function writeDependecies(dependencias) {
  for (var i=0;i<dependencias.length;i++) {
    var tagScript = document.createElement('script');
    tagScript.setAttribute('src', dependencias[i]);
    document.head.appendChild(tagScript);
  }
}