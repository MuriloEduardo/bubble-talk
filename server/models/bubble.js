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
		data_cadastro: {
			type: Date, 
			default: Date.now
		}
	},
	administradores: []
});

module.exports = mongoose.model('Bubble', bubbleSchema);