"use strict";
const stepProcessors = require('./stepprocessor.js').stepProcessor;
const ast = require("./ast.js");
const readModule = require('./readStepProcessor.js');
const forModule = require('./forStepProcessor.js');
const ifModule = require('./ifStepProcessor.js');

const factory = {

	createProcessorsPerSentence: function(sentence, rebuild, varTable,options) {
		if (sentence instanceof ast.readStatement) {

			return new readModule.readStepProcessor(rebuild, sentence, varTable);

		} else if (sentence instanceof ast.forStatement) {

			return new forModule.forStepProcessor(rebuild, sentence, varTable,options);

		} else if (sentence instanceof ast.ifStatement) {

			return new ifModule.ifStepProcessor(rebuild, sentence, varTable,options);

		}

		return null;
	}
}

module.exports = factory;