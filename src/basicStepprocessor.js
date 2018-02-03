"use strict";

const stepProcessors = require('./stepprocessor.js').stepProcessor;
const parser = require('./parser.js').parser;
const VarTable = require('./varTable.js');
const ast = require("./ast.js");



function BasicStepProcessor(rebuild, history, superVarTable) {

	stepProcessors.call(this, rebuild, history);
	this.varTable = new VarTable();
	this.history = history;
	if (superVarTable) {
		this.superEntry = superVarTable;
	}

}

BasicStepProcessor.prototype = Object.create(stepProcessors.prototype);

BasicStepProcessor.prototype.processByMacros = function(answer) {
	return answer;
};

BasicStepProcessor.prototype.processInput = function(answer) {

	if (answer.line === "")
		return null;

	if (answer.historyEdited && !answer.bufferEdited)
		return this.history.getLastEditedEntry().clone();

	var sentence = parser.parse(answer.line);
	this.rebuild.console.info(sentence.toCode());
	return sentence;
};



BasicStepProcessor.prototype.processStep = function(answer) {

	answer = this.processByMacros(answer);
	var sentence = this.processInput(answer);
	this.processSentence(sentence);
};



BasicStepProcessor.prototype.runStep = function() {

	var self = this;
	self.stepContext = {
		addToHistory: true
	};


	return new Promise(function(resolve, reject) {

		self.rebuild.getLine({
			history: self.lineHistory,
			prompt: self.setPrompt('rebuildx}')
		}).then(function(answer) {

			try {

				self.processStep(answer);

			} catch (e) {

				self.rebuild.console.log(e);
			}

			resolve();

		}).catch(function(argument) {

			reject(argument);
		});

	});



};

BasicStepProcessor.prototype.processCommand = function(command) {

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
					this.history.forEach(function(sentence, unused, j) {

						if (sentence instanceof ast.executableStatement)
							this.rebuild.console.log((i++) + ":" + multiply(' ', j) + sentence.toCode());
					}, this);
				}
				break;
			case "stepin":
				{

					const lastStatement = this.history.getLastEditedEntry();
					if (lastStatement instanceof ast.executableStatement) {
						this.stepInStatement(lastStatement);
					}
				}
				break;
			case "listall":
				{
					let i = 0;

					this.history.forEach(function(sentence, unused, j) {
						this.rebuild.console.log((i++) + ":" + multiply(' ', j) + sentence.toCode());
					}, this);
				}
				break;


			default:
				throw ("Unknown command");
		}

	} else {
		throw ("Failed to process sentence" + JSON.stringify(command.toJson()));
	}


};

BasicStepProcessor.prototype.processEndStatement = function() {

	this.isDead = true;
	this.stepContext.addToHistory = false;

};

BasicStepProcessor.prototype.stepInStatement = function(statement) {

	this.processStatement(statement, {
		debug: 'stepin'
	});
}

BasicStepProcessor.prototype.processStatement = function(statement,options) {
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
	} else {

		const processor = this.rebuild.processorFactory.createProcessorsPerSentence(statement, this.rebuild, this.varTable,options);
		if (processor) {

			this.rebuild.addNewProcessor(processor);

		} else {

			throw ("Failed to process sentence" + JSON.stringify(statement.toJson()));
		}


	}
};

BasicStepProcessor.prototype.processSentence = function(sentence) {

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
		this.processStatement(sentence);
	} else {
		throw ("Un recognised sentence" + JSON.stringify(sentence.toJson()));
	}

	this.updateHistory(sentence);

};

BasicStepProcessor.prototype.updateHistory = function(sentence) {

	if (this.stepContext.addToHistory)
		this.rebuild.addHistoryEntry(sentence);
};



exports.BasicStepProcessor = BasicStepProcessor;