const stepProcessors = require('./stepprocessor.js').stepProcessor;
const readProcessors = require('./readStepProcessor.js').readStepProcessor;
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
	return new Promise(function(resolve, reject) {

		self.rebuild.getLine({
			history: self.lineHistory,
			prompt: self.setPrompt('rebuildx}')
		}).then(function(answer) {


			if (answer != "") {

				self.lineHistory.add(answer);

				try{
					var sentence = parser.parse(answer);
					console.log(sentence.toCode());
					self.process(sentence);

				} catch (e) {

					console.error(e);

				}

			} else {

				self.isDead = true;

			}

			resolve();

		});

	});



};



BasicStepProcessor.prototype.process = function(sentence) {


	if (sentence instanceof ast.printStatement) {
		var output = "";

		for (var i = 0; i < sentence.elements.length; i++) {

			output += sentence.elements[i].evaluate(this.varTable);
		}
		console.log(output);

	} else if (sentence instanceof ast.letStatement) {

		this.varTable.setEntry(sentence.varName, sentence.expression.evaluate());

	} else if (sentence instanceof ast.readStatement) {

		this.rebuild.addNewProcessor(new readProcessors(this.rebuild, sentence, this.varTable));
	}
}


exports.BasicStepProcessor = BasicStepProcessor;