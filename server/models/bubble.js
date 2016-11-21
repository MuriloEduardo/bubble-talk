var mongoose = require('mongoose');

var bubbleSchema = mongoose.Schema({
	dados: {
		appname: String,
		termos: Boolean,
		telefone: String,
		endereco: {
			cep: Number,
			logradouro: String,
			numero: Number,
			complemento: String,
			bairro: String,
			cidade: String,
			estado: String
		},
		data_cadastro: {type: Date, default: Date.now}
	},
	criador: String,
	administradores: [],
	conversas: [
		{
			socket_id: String,
			ultima_visualizacao: {type: Date},
			mensagens: [
				{
					mensagem: String,
					data: {type: Date},
					visulizada: Boolean,
					remetente: Boolean
				}
			]
		}
	]
});

module.exports = mongoose.model('Bubble', bubbleSchema);