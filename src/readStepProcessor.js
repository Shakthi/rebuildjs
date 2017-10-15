

debugger;


const superClass = require('./basicStepprocessor.js');

var readStepProcessor = function(rebuild, history, superVarTable) {
	superClass.call(this, rebuild, history, superVarTable)
	this.statement = statement;
	this.prompt = this.statement.prompt;

}


readStepProcessor.prototype = Object.create(superClass.prototype);

readStepProcessor.prototype.runStep = function() {

	if (!this.prompt) {
		this.prompt = "input";
	}

	var self = this;
	return new Promise(function(resolve, reject) {

		self.rebuild.getLine({
			history: self.lineHistory,
			prompt: self.setPrompt('rebuildx}input}')
		}).then(function(answer) {

			debugger;
			if (answer != "") {

				var inputval = eval(answer);

				if (Array.isArray(inputval)) {

					for (var i = 0; i < self.statement.elements.length; i++) {

						if(i >= inputval.length)
							break;
						self.varTable.setEntry(self.statement.elements[i],inputval[i]);

					}

				}else{
						self.varTable.setEntry(self.statement.elements[0],inputval);					
				}



			} else {

				self.isDead = true;

			}

			resolve();

		});

	});


};


module.exports = readStepProcessor;
