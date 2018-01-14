'use strict';
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
		super.onEnter();
		this.history.init();
		this.initialize();
	}

	onExit() {
		this.archiveStatement();
		super.onExit();
	}

	initialize() {
		this.unarchiveStatement();
		this.initializeI();
	}

	archiveStatement() {


		this.statement.subStatements = [];
		this.history.getContent().forEach(function(statement) {

			if (statement instanceof ast.executableStatement) {
				this.statement.subStatements.push(statement);
			}

		}, this);
	}

	unarchiveStatement() {

		this.statement.subStatements.forEach(function(argument) {
			this.history._internalAdd(argument);
		}, this);
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


	_runSynchronus() {

		var beginvalue = this.statement.fromExpression.evaluate(this.varTable);
		this.varTable.setEntry(this.statement.varName, beginvalue);
		var that = this;

		function runner(statement) {

			if (statement instanceof ast.executableStatement) {
				that.processStatement(statement);
			}

		}
		while (this.evaluateExitConditionI()) {

			this.history.getContent().forEach(runner, this);

			runner.call(this);
			this.varTable.setEntry(this.statement.varName, this.varTable.getEntry(this.statement.varName) + 1);

		}


	}

	processCommand(command) {

		if (command instanceof ast.CustomCommand) {

			switch (command.name) {
				case 'run':
					this._runSynchronus();
					break;
				case 'checkback':
					for (var i = this.history.getContent().length - 1; i >= 0; i--) {
						if (this.history.getContent()[i] instanceof ast.executableStatement) {
							this.history.popBack();
							break;
						}
					}
					this.stepContext.addToHistory = false;


					break;
				default:
					super.processCommand(command);
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

	updateHistory(sentence) {

		if (this.stepContext.addToHistory) {
			this.addToHistory(sentence);
		}

		if (this.stepContext.needToHistory) {

			this.history.rewind();
		}

	}

	addToHistory(sentence) {

		const writeContent = this.history.getContent()[this.history.getWriteHistoryIndex()];
		if (writeContent instanceof ast.UnProcessedSentence) {
			this.rebuild.addHistoryEntry(sentence, {
				replace: false
			});
		} else {
			this.rebuild.addHistoryEntry(sentence, {
				replace: true
			});
		}


	}



}
exports.forStepProcessor = forStepProcessor;