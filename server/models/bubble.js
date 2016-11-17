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
			digitando: Boolean,
			ultima_visualizacao: {type: Date},
			ultima_mensagem: String,
			nao_visualizadas: Number,
			online: Boolean,
			mensagens: [
				{
					mensagem: String,
					data: {type: Date, default: Date.now},
					visulizada: Boolean,
					remetente: Boolean
				}
			]
		}
	]
});

module.exports = mongoose.model('Bubble', bubbleSchema);