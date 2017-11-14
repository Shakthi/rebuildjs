const stepProcessors = require('./stepprocessor.js').stepProcessor;
const readProcessors = require('./readStepProcessor.js').readStepProcessor;
const forProcessors = require('./forStepProcessor.js').forStepProcessor;
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
					self.process(sentence);


				} catch (e) {

					if (e.hash) {
						if (e.hash.expected) {

							var expected = e.hash.expected;
							var output = 'Error expected:';
							expected.forEach(function(argument) {
								output += argument;
								output += ' ';
							})

							output += "Found '" + e.hash.token + "'" + "('" + e.hash.text + "')";

							self.rebuild.console.log(output);

						}
					} else {
						throw (e);
					}


				}

			} else {

				self.isDead = true;

			}

			if (self.stepContext.addToHistory)
				self.rebuild.addHistoryEntry(answer);
			resolve();

		}).catch(function(argument) {

			reject(argument);
		});

	});



};



BasicStepProcessor.prototype.process = function(sentence) {


	if (sentence instanceof ast.printStatement) {
		var output = "";

		for (var i = 0; i < sentence.elements.length; i++) {

			output += sentence.elements[i].evaluate(this.varTable);
		}
		this.rebuild.console.log(output);

	} else if (sentence instanceof ast.letStatement) {

		this.varTable.setEntry(sentence.varName, sentence.expression.evaluate());

	} else if (sentence instanceof ast.readStatement) {

		this.rebuild.addNewProcessor(new readProcessors(this.rebuild, sentence, this.varTable));
	} else if (sentence instanceof ast.endStatement) {

		this.isDead = true;
		this.stepContext.addToHistory =false;

	}else if (sentence instanceof ast.forStatement) {

		this.rebuild.addNewProcessor(new forProcessors(this.rebuild, sentence, this.varTable));

	} 
}


exports.BasicStepProcessor = BasicStepProcessor;