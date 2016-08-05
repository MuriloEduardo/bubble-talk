/*
	Este arquivo será responsável por criar todos os códigos html's necessários
	E também, responsável por ter os "escutadores", dos cliques sem angular
*/
$(window).ready(function(){

	// Bubble - Bolha - Bola
	// Quando clicada conecta usuario e cliente
	var html = '<div id="bubbleApp"></div>';
	html += '<div id="chatApp"></div>';

	$('body').append(html).promise().done(function(){

		function fixPageXY(e) {
			if (e.pageX == null && e.clientX != null ) { 
				var html = document.documentElement;
				var body = document.body;

				e.pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
				e.pageX -= html.clientLeft || 0;

				e.pageY = e.clientY + (html.scrollTop || body && body.scrollTop || 0);
				e.pageY -= html.clientTop || 0;
			}
		}

		function toggleChat(){

			var Chat = $('#chatApp');
			var oldRightChat = Chat.css('right');

			if(Chat.css('right')!='0px'){
				// Esta fechado
				// Agora abrirá
				Chat.css('right', '0');
			}else{
				// Esta aberto
				// Deve voltar ao css predefinido
				Chat.css('right', oldRightChat);
				console.log(oldRightChat)
			}
		}
		
		// Abre e fecha chat, quando o cliente clica e solta o Bubble
		// Somente quando "mouseup", pois: "mousedown && click" arrastao Bubble pela página
		// Um de seus diferenciais, a experiencia que o usuario de nossos clientes
		document.getElementById('bubbleApp').onmousedown = function() {
			this.style.position = 'absolute';

			var self = this;

			document.onmousemove = function(e) {
				e = e || event
				fixPageXY(e);;
				
				// Colocar centro de bola sob ponteiro do mouse.
				// 25 é metade da largura / altura
				self.style.left = e.pageX-50+'px';
				self.style.top = e.pageY-50+'px';
			}
			this.onmouseup = function() {
				document.onmousemove = null;

				// Aqui deveráabrir o chat
				toggleChat();
			}
		}
    });
})