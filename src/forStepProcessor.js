"use strict";
const superClass = require('./basicStepprocessor.js').BasicStepProcessor;
const ast = require('./ast.js');
const StackedSentenceHistory = require('./StackedSentenceHistory.js');

class forStepProcessor extends superClass {

	constructor(rebuild, statement, superVarTable) {

		super(rebuild, new StackedSentenceHistory(rebuild.getHistoryStack()), superVarTable);
		this.statement = statement;
		this.varTable = superVarTable;
		this.initStatus = false;


	}


	onEnter() {
		this.history.init();
		this.initialize();
		super.onEnter.call(this);
	}

	initialize() {
		this.unarchiveStatement();
		this.initializeI();
	}

	archiveStatement() {

		this.statement.clear();

		// this.history.forEach(function(argument) {

		// 	if (sentence instanceof executableStatement)
		// 		if (!(sentence instanceof ast.errorStatement))
		// })
	}

	unarchiveStatement() {

	}


	initializeI() {
		var beginvalue = this.statement.fromExpression.evaluate(this.varTable);
		this.varTable.setEntry(this.statement.varName, beginvalue);
		this.initStatus = this.evaluateExitConditionI();
	}


	getIValue() {
		return this.varTable.getEntry(this.statement.varName);
	}

	evaluateExitConditionI() {
		//var beginvalue = this.statement.toExpression.evaluate(this.varTable);
		var endvalue = this.statement.toExpression.evaluate(this.varTable);
		var forValue = this.getIValue();

		return (forValue <= endvalue);
	}

	processCommand(command) {

		if (command instanceof ast.CustomCommand) {

			switch (command.name) {
				default: super.processCommand(command);
			}

		} else {
			throw ("Failed to process sentence" + JSON.stringify(command.toJson()));
		}

	}



	runStep() {

		var self = this;

		self.stepContext = {
			addToHistory: true
		};


		return new Promise(function(resolve) {

			if (self.initStatus) {

				self.rebuild.getLine({
					history: self.lineHistory,
					prompt: self.setPrompt("for " + self.statement.varName + "}")
				}).then(function(answer) {

					self.processStep(answer);
					resolve();
				});

			} else {

				self.rebuild.getLine({
					history: self.lineHistory,
					prompt: self.setPrompt("for end}")
				}).then(function(answer) {

					self.processStep(answer);
					self.markDead();
					resolve();


				});

			}



		});


	}

	processSentence(argument) {
		super.processSentence(argument);
	}

	upadateHistory(sentence) {

		super.upadateHistory(sentence);

		if (this.stepContext.needToHistory) {

			this.history.rewind();

		}



	}



}
exports.forStepProcessor = forStepProcessor;