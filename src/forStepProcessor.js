const superClass = require('./basicStepprocessor.js').BasicStepProcessor;
const parser = require('./parser.js').parser;


class forStepProcessor extends superClass {

	constructor(rebuild, statement, superVarTable) {
		super(rebuild, null, superVarTable)
		this.statement = statement;
		this.varTable = superVarTable;
		this.initStatus = false;

	}


	onEnter() {
		this.initialize();
		super.onEnter.call(this);
	};

	initialize() {
		this.initializeI();
	}

	initializeI() {
		var beginvalue = this.statement.fromExpression.evaluate(this.varTable);
		this.varTable.setEntry(this.statement.varName, beginvalue);
		this.initStatus = this.evaluateExitConditionI();
	};


	getIValue() {
		return this.varTable.getEntry(this.statement.varName);
	}

	evaluateExitConditionI() {
		var beginvalue = this.statement.toExpression.evaluate(this.varTable);
		var endvalue = this.statement.toExpression.evaluate(this.varTable);
		var forValue = this.getIValue();

		return (forValue <= endvalue);
	};



	runStep() {

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

	processSentence(argument) {
		super.processSentence(argument);
	}

}
exports.forStepProcessor = forStepProcessor;