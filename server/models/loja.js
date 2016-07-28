var mongoose = require('mongoose');

var lojaSchema = mongoose.Schema({
	dados: {
		nome: String,
		ramo: String,
		termos: Boolean,
		cnpj: String,
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
	frete: {
		tipo_frete: String,
		tipo_entrega: String
	},
	administradores: []
});

module.exports = mongoose.model('Loja', lojaSchema);