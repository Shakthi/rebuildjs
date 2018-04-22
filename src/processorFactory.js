"use strict";
const stepProcessors = require('./stepprocessor.js').stepProcessor;
const ast = require("./ast.js");
const readModule = require('./readStepProcessor.js');
//const forModule = require('./forStepProcessor.js');
//const forModule = require('./forElseStepProcessor.js');
const forModule = require('./forSimpleElseStepProcessor');

const ifModule = require('./ifStepProcessor');

const expressionModule = require('./ExpressionProcessor');

const functionProcessor = require('./FunctionProcessor');



const factory = {

	createProcessorsPerSentence: function(sentence, rebuild, varTable,options) {
		if (sentence instanceof ast.readStatement) {

			return new readModule.readStepProcessor(rebuild, sentence, varTable);

		} else if (sentence instanceof ast.forStatement) {

			return new forModule.forElseStepProcessor(rebuild, sentence, varTable,options);

		} else if (sentence instanceof ast.ifStatement) {

			return new ifModule.ifStepProcessor(rebuild, sentence, varTable,options);

		}
		else if (sentence instanceof ast.functionExpression) {

			return  functionProcessor;

		}

		return null;
	},

	getExpressionProcessor :function(){
		return expressionModule;
	}
}

module.exports = factory;