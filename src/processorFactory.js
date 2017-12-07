"use strict";
const stepProcessors = require('./stepprocessor.js').stepProcessor;
const ast = require("./ast.js");
const readModule = require('./readStepProcessor.js');
const forModule = require('./forStepProcessor.js');


const factory = {

	createProcessorsPerSentence: function(sentence, rebuild, varTable) {
		if (sentence instanceof ast.readStatement) {

			return new readModule.readStepProcessor(rebuild, sentence, varTable);

		} else if (sentence instanceof ast.forStatement) {

			return new forModule.forStepProcessor(rebuild, sentence, varTable);

		}

		return null;
	}
}

module.exports = factory;