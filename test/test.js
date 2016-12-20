// test/test.js

var assert = require('assert'),
exemplo = require('../server/models/exemplo');

describe('exemplo-ut', function() {
	describe('request', function() {
		it('apenas true', function() {
			assert.equal(true, true);
		});
		it('chamada ao servico', function() {
			exemplo.chamaServico(function(res) {
				assert.equal('Hello Word',res);
			});
		});
	});
});