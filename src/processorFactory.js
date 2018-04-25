"use strict";
const stepProcessors = require('./stepprocessor.js').stepProcessor;
const ast = require("./ast.js");
const readModule = require('./readStepProcessor.js');
//const forModule = require('./forStepProcessor.js');
//const forModule = require('./forElseStepProcessor.js');
const forModule = require('./forSimpleElseStepProcessor.ts');

const ifModule = require('./ifStepProcessor.ts');

const functionProcessor = require('./FunctionProcessor.ts');
const functionDefinition = require('./FunctionDefinitionProcessor.ts');




const factory = {

	createProcessorsPerSentence: function(sentence, rebuild, varTable,options) {
		
		const constuct= this.getProcessorsConstructorPerSentence(sentence);
		return new constuct(rebuild, sentence, varTable,options);		
	},

	getProcessorsConstructorPerSentence :function(sentence){

		var map = {
			readStatement:readModule.readStepProcessor,
			forStatement:forModule.forElseStepProcessor,
			ifStatement:ifModule.ifStepProcessor,
			functionExpression:functionProcessor,
			functionDefine:functionDefinition
		};

		for (const key in map) {
			if (map.hasOwnProperty(key)) {

				const processor = map[key];

				if (sentence instanceof ast[key]) {
					return processor;
				}

			}
		}

		throw "Unexissting";		
	}

	
}

module.exports = factory;