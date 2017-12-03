const stepProcessors = require('./stepprocessor.js').stepProcessor;
const parser = require('./parser.js').parser;
const VarTable = require('./varTable.js');
const ast = require("./ast.js");



function BasicStepProcessor(rebuild, history, superVarTable) {

	stepProcessors.call(this, rebuild, history);
	this.varTable = new VarTable();
	if (superVarTable) {
		this.superEntry = superVarTable;
	}

}

BasicStepProcessor.prototype = Object.create(stepProcessors.prototype);


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

			if (answer != "") {
				try {

					var sentence = parser.parse(answer);
					self.rebuild.console.log(sentence.toCode());
					self.processSentence(sentence);

				} catch (e) {

					self.rebuild.console.log(e);
				}

			} else {

				self.rebuild.isAlive = false;
				self.stepContext.addToHistory = false;


			}

			if (self.stepContext.addToHistory)
				self.rebuild.addHistoryEntry(sentence);
			resolve();

		}).catch(function(argument) {

			reject(argument);
		});

	});



};



BasicStepProcessor.prototype.processSentence = function(sentence) {


	if (sentence instanceof ast.printStatement) {
		var output = "";

		for (var i = 0; i < sentence.elements.length; i++) {

			output += sentence.elements[i].evaluate(this.varTable);
		}
		this.rebuild.console.log(output);

	} else if (sentence instanceof ast.letStatement) {

		this.varTable.setEntry(sentence.varName, sentence.expression.evaluate());

	} else if (sentence instanceof ast.endStatement) {

		this.isDead = true;
		this.stepContext.addToHistory = false;

	} else if (sentence instanceof ast.errorStatement) {

		this.rebuild.console.log("! " + sentence.message);
	} else {

		this.rebuild.addNewProcessor(this.rebuild.processorFactory.createProcessorsPerSentence(sentence, this.rebuild, this.varTable));
	}
}


exports.BasicStepProcessor = BasicStepProcessor;