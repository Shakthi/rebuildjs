const superClass = require('./basicStepprocessor.js').BasicStepProcessor;
const parser = require('./parser.js').parser;


const forStepProcessor = function(rebuild, statement, superVarTable) {
	superClass.call(this, rebuild, null, superVarTable)
	this.statement = statement;
	this.varTable = superVarTable;
	this.initStatus = false;

}


forStepProcessor.prototype = Object.create(superClass.prototype);

forStepProcessor.prototype.onEnter = function() {
	this.initialize();
	superClass.prototype.onEnter.call(this);
};

forStepProcessor.prototype.initialize = function() {
	this.initializeI();
}

forStepProcessor.prototype.initializeI = function() {
	var beginvalue = this.statement.fromExpression.evaluate(this.varTable);
	this.varTable.setEntry(this.statement.varName, beginvalue);
	this.initStatus = this.evaluateExitConditionI();
};


forStepProcessor.prototype.getIValue = function() {
	return this.varTable.getEntry(this.statement.varName);
}

forStepProcessor.prototype.evaluateExitConditionI = function() {
	var beginvalue = this.statement.toExpression.evaluate(this.varTable);
	var endvalue = this.statement.toExpression.evaluate(this.varTable);
	var forValue = this.getIValue();

	return (forValue <= endvalue);
};



forStepProcessor.prototype.runStep = function() {

	var self = this;

	self.stepContext = {
		addToHistory: true
	};


	return new Promise(function(resolve, reject) {

		if (self.initStatus) {

			self.rebuild.getLine({
				history: self.lineHistory,
				prompt: self.setPrompt("for " + self.statement.varName + "}")
			}).then(function(answer) {

				if (answer != "") {

					const sentence = parser.parse(answer);
					self.processSentence(sentence);
					resolve();

				} else {
					
					self.stepContext.addToHistory = false;
					self.rebuild.isAlive = false;
					resolve();

				}


			});

		} else {

			self.rebuild.getLine({
				history: self.lineHistory,
				prompt: self.setPrompt("for end}")
			}).then(function(answer) {

				const sentence = parser.parse(answer);
				self.processSentence(sentence);
				self.markDead();
				resolve();


			});

		}



	});


};

forStepProcessor.prototype.processSentence = function(argument) {
	superClass.prototype.processSentence.call(this, argument);
}


exports.forStepProcessor = forStepProcessor;