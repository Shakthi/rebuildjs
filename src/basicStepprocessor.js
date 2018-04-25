
"use strict";

const stepProcessors = require('./stepprocessor.js');
const stepProcessor = stepProcessors.stepProcessor;
const parser = require('./parser.js').parser;
const VarTable = require('./varTable.js');
const ast = require("./ast.js");




function BasicStepProcessor(rebuild, history, superVarTable) {

	stepProcessor.call(this, rebuild, history);
	this.varTable = new VarTable();
	if (superVarTable) {
		this.varTable.superEntry = superVarTable;
	}

	this.macros = "lscd";

}

BasicStepProcessor.prototype = Object.create(stepProcessor.prototype);

BasicStepProcessor.prototype.processByMacros = function (answer) {
	if (!answer.key)
		return answer;

	this.stepContext.addToHistory = false;
	this.stepContext.traceParsed = false;
	this.stepContext.macrosSubstituted = true;


	var answer2 = answer;
	switch (answer.key.name) {
		case 'l':
			answer2.line = '.list';
			this.rebuild.console.write("\n");
			break;
		case 'c':
			answer2.line = '.quit';
			this.rebuild.console.write("\n");
			break;
		case 's':
			answer2.line = '.stepin';
			this.stepContext.traceParsed = false;
			this.rebuild.console.write("\n");

			this.stepContext.addToHistory = false;
			break;
		case 'd':
			answer2.line = 'end';
			this.rebuild.console.write("\n");
			this.stepContext.addToHistory = false;

			break;
	}


	return answer2;

};

BasicStepProcessor.prototype.processInput = function (answer) {

	if (answer.line === "")
		return null;

	if ((answer.historyEdited || answer.prefilled) && !answer.bufferEdited && !this.stepContext.macrosSubstituted) {
		this.stepContext.reusedSentence = true;
		return this.lineHistory.getLastEditedEntry().clone();
	}

	var sentence = parser.parse(answer.line);

	if (this.stepContext.traceParsed) {
		this.rebuild.console.info(sentence.toCode());
	}

	return sentence;
};



BasicStepProcessor.prototype.processStep = function (answer) {

	answer = this.processByMacros(answer);
	var sentence = this.processInput(answer);
	this.processSentence(sentence);
};

BasicStepProcessor.prototype.processStepAsync = function* (answer) {

	answer = this.processByMacros(answer);
	var sentence = this.processInput(answer);
	yield* this.processSentenceAsync(sentence);
};




BasicStepProcessor.prototype.runStep = async function () {

	var self = this;
	self.stepContext = {
		addToHistory: true,
		traceParsed: true
	};



	const answer = await self.rebuild.getLine({
		history: self.lineHistory,
		prompt: self.setPrompt('rebuildx}'),
		macros: self.macros
	});

	try {

		self.processStep(answer);

	} catch (e) {

		self.rebuild.console.log(e);
	}

};

BasicStepProcessor.prototype.processCommand = function (command) {

	function multiply(ch, n) {
		var out = "";
		for (var i = 0; i < n; i++) {
			out += ch;
		}
		return out;
	}

	if (command instanceof ast.CustomCommand) {

		switch (command.name) {
			case "list":
				{
					let i = 0;
					this.lineHistory.forEach(function (sentence, unused, j) {

						if (sentence instanceof ast.executableStatement)
							this.rebuild.console.log((i++) + ":" + multiply(' ', j) + sentence.toCode());
					}, this);
				}
				break;
			case "stepin":
				{

					const lastStatement = this.lineHistory.getLastEditedEntry();
					if (lastStatement instanceof ast.executableStatement) {
						this.stepInStatement(lastStatement);
						this.stepContext.addToHistory = true;
						this.updateHistory(lastStatement);
						this.stepContext.addToHistory = false;
					}
				}
				break;
			case "listall":
				{
					let i = 0;

					this.lineHistory.forEach(function (sentence, unused, j) {
						this.rebuild.console.log((i++) + ":" + multiply(' ', j) + sentence.toCode());
					}, this);
				}
				break;

			case 'quit':
				this.markDead(stepProcessors.DeathReason.abort);
				break;



			default:
				throw ("Unknown command");
		}

	} else {
		throw ("Failed to process sentence" + JSON.stringify(command.toJson()));
	}


};

BasicStepProcessor.prototype.processEndStatement = function () {
	stepProcessor.prototype.returnStep.call(this,{ type: "endStatement", value: undefined })
	this.stepContext.addToHistory = false;
};

BasicStepProcessor.prototype.stepInStatement = function (statement) {

	this.processStatement(statement, {
		debug: 'stepin'
	});
};

BasicStepProcessor.prototype.processStatement = function (statement, options) {
	if (!options) {
		options = {};
	}

	if (statement instanceof ast.printStatement) {
		var output = "";

		for (var i = 0; i < statement.elements.length; i++) {

			output += statement.elements[i].evaluate(this.varTable);
		}
		this.rebuild.console.log(output);

	} else if (statement instanceof ast.letStatement) {

		this.varTable.setEntry(statement.varName, statement.expression.evaluate());

	} else if (statement instanceof ast.endStatement) {

		this.processEndStatement();

	} else if (statement instanceof ast.errorStatement) {

		this.rebuild.console.log("! " + statement.message);
	} else if (statement instanceof ast.LineComment) {

		this.rebuild.console.info(statement.message);

	} else if (statement instanceof ast.DebuggerTrap) {

		this.rebuild.console.info(statement.message);
	}
	else if (statement instanceof ast.PassStatement) {
	}
	else if (statement instanceof ast.returnStatement) {
		this.returnStep(statement.expression.evaluate(this.varTable))

	}

	else {
		options.reloaded = this.stepContext.reusedSentence;
		const processor = this.rebuild.processorFactory.createProcessorsPerSentence(statement, this.rebuild, this.varTable, options);
		if (processor) {

			this.rebuild.addNewProcessor(processor);

		} else {

			throw ("Failed to process sentence" + JSON.stringify(statement.toJson()));
		}


	}
};


BasicStepProcessor.prototype.returnStep = function (result) {
	stepProcessor.prototype.returnStep.call(this,{ type: "returnStatement", value: result })
};

BasicStepProcessor.prototype.callProcessorAsync = function* (processor) {
	this.rebuild.addNewProcessor(processor);
	const responce = yield;
	return responce;
}


BasicStepProcessor.prototype.expresionProcessorAsync = function* (expression, varTable) {

	var stackMachineCode = [];
	var execStack = [];

	expression.toPostFixCode(stackMachineCode);


	do {
		var result = stackMachineCode.shift().execute(varTable, execStack);
		if (result && result.type) {
			var processor = this.rebuild.processorFactory.getProcessorsConstructorPerSentence(result.function);
			var responce = yield* this.callProcessorAsync(new processor(this.rebuild, result.function, this.varTable, result.argumentList, {}));
			execStack.push(responce);
		} else {
			yield;
		}


	} while (stackMachineCode.length != 0);

	return execStack.pop();

}




BasicStepProcessor.prototype.evaluateExpressionAsync = function* (expression, _vartable) {

	let varTable = _vartable ? _vartable : this.varTable;

	let value = yield* this.expresionProcessorAsync(expression, varTable);

	
	return value;
}

BasicStepProcessor.prototype.processStatementAsync = function* (statement, options) {
	if (!options) {
		options = {};
	}

	if (statement instanceof ast.printStatement) {
		var output = "";

		for (var i = 0; i < statement.elements.length; i++) {

			output += yield* this.evaluateExpressionAsync(statement.elements[i]);
		}
		this.rebuild.console.log(output);

	} else if (statement instanceof ast.letStatement) {

		this.varTable.setEntry(statement.varName, yield* this.evaluateExpressionAsync(statement.expression));

	} else if (statement instanceof ast.endStatement) {

		this.processEndStatement();

	} else if (statement instanceof ast.errorStatement) {

		this.rebuild.console.log("! " + statement.message);
	} else if (statement instanceof ast.LineComment) {

		this.rebuild.console.info(statement.message);

	} else if (statement instanceof ast.DebuggerTrap) {

		this.rebuild.console.info(statement.message);
	}
	else if (statement instanceof ast.PassStatement) {
	}
	else if (statement instanceof ast.returnStatement) {
		this.returnStep(yield* this.evaluateExpressionAsync(statement.expression));
	}

	else {
		options.reloaded = this.stepContext.reusedSentence;
		const processor = this.rebuild.processorFactory.createProcessorsPerSentence(statement, this.rebuild, this.varTable, options);
		if (processor) {

			var result = yield* this.callProcessorAsync(processor);

		} else {

			throw ("Failed to process sentence" + JSON.stringify(statement.toJson()));
		}


	}
};

BasicStepProcessor.prototype.processSentence = function (sentence) {

	if (sentence === null) {
		this.rebuild.isAlive = false;
		this.stepContext.addToHistory = false;

	} else if (sentence instanceof ast.Command) {

		try {
			this.processCommand(sentence);
		} catch (e) {
			if (e != "Unknown command") {
				throw (e);
			}

		}

	} else if (sentence instanceof ast.Statement) {
		if (sentence instanceof ast.DebuggerTrap) {
			if (sentence.oldSentence) {
				sentence = sentence.oldSentence;
			}
		}

		this.processStatement(sentence, {});
	} else if (sentence instanceof ast.LineComment) {
		//throw ("Un recognised sentence" + JSON.stringify(sentence.toJson()));
	} else {
		throw ("Un recognised sentence" + JSON.stringify(sentence.toJson()));
	}

	this.updateHistory(sentence);

};


BasicStepProcessor.prototype.processSentenceAsync = function* (sentence) {

	if (sentence === null) {
		this.rebuild.isAlive = false;
		this.stepContext.addToHistory = false;

	} else if (sentence instanceof ast.Command) {

		try {
			this.processCommand(sentence);
		} catch (e) {
			if (e != "Unknown command") {
				throw (e);
			}

		}

	} else if (sentence instanceof ast.Statement) {
		if (sentence instanceof ast.DebuggerTrap) {
			if (sentence.oldSentence) {
				sentence = sentence.oldSentence;
			}
		}

		yield* this.processStatementAsync(sentence, {});
	} else if (sentence instanceof ast.LineComment) {
		//throw ("Un recognised sentence" + JSON.stringify(sentence.toJson()));
	} else {
		throw ("Un recognised sentence" + JSON.stringify(sentence.toJson()));
	}

	this.updateHistory(sentence);

};

BasicStepProcessor.prototype.updateHistory = function (sentence) {

	if (this.stepContext.addToHistory)
		this.rebuild.addHistoryEntry(sentence);
};



exports.BasicStepProcessor = BasicStepProcessor;