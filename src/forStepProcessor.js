const superClass = require('./stepprocessor.js').stepProcessor;

var forStepProcessor = function(rebuild, statement, superVarTable) {
	superClass.call(this, rebuild, null, superVarTable)
	this.statement = statement;
	this.varTable = superVarTable;

}


forStepProcessor.prototype = Object.create(superClass.prototype);

forStepProcessor.prototype.runStep = function() {

	if (!this.prompt) {
		this.prompt = "for ";
		
		

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

				self.isDead = true;



			} else {

				self.isDead = true;

			}

			resolve();

		});

	});


};


exports.forStepProcessor = forStepProcessor;