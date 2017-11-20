const superClass = require('./basicStepprocessor.js').BasicStepProcessor;
const parser = require('./parser.js').parser;


const forStepProcessor = function(rebuild, statement, superVarTable) {
	superClass.call(this, rebuild, null, superVarTable)
	this.statement = statement;
	this.varTable = superVarTable;

}


forStepProcessor.prototype = Object.create(superClass.prototype);

forStepProcessor.prototype.runStep = function() {

	var self = this;

	self.stepContext = {
		addToHistory: true
	};

	if (!this.prompt) {
		this.prompt = "for ";
		this.prompt += '}';
	}



	return new Promise(function(resolve, reject) {

		self.rebuild.getLine({
			history: self.lineHistory,
			prompt: self.setPrompt(self.prompt)
		}).then(function(answer) {


			const sentence = parser.parse(answer);
			self.processSentence(sentence);
			resolve();

		});

	});


};

forStepProcessor.prototype.processSentence = function(argument) {
	 superClass.prototype.processSentence.call(this,argument);
}


exports.forStepProcessor = forStepProcessor;