"use strict";
const superClass = require('./stepprocessor.js').stepProcessor;

var readStepProcessor = function(rebuild, statement, superVarTable) {
	superClass.call(this, rebuild, null, superVarTable)
	this.statement = statement;
	this.prompt = this.statement.prompt;
	this.varTable = superVarTable;

}


readStepProcessor.prototype = Object.create(superClass.prototype);

readStepProcessor.prototype.runStep = function() {

	if (!this.prompt) {
		this.prompt = "input ";
		
		for (var i = 0; i < this.statement.elements.length; i++) {
			this.prompt += ("'" + this.statement.elements[i] + "'");
			if (i != this.statement.elements.length - 1) {
				this.prompt += ',';
			}
		}

		this.prompt += '}';
	}



	var self = this;
	return new Promise(function(resolve, reject) {

		self.rebuild.getLine({
			history: self.lineHistory,
			prompt: self.setPrompt(self.prompt)
		}).then(function(answer) {

			if (answer != "") {

				var inputval = eval(answer);

				if (Array.isArray(inputval)) {

					for (var i = 0; i < self.statement.elements.length; i++) {

						if (i >= inputval.length)
							break;
						self.varTable.setEntry(self.statement.elements[i], inputval[i]);

					}

				} else {
					self.varTable.setEntry(self.statement.elements[0], inputval);
				}

				self.markDead();



			} else {

				self.markDead();;

			}

			resolve();

		});

	});


};


exports.readStepProcessor = readStepProcessor;