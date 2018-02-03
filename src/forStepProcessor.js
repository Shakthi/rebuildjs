'use strict';
const superClass = require('./basicStepprocessor.js').BasicStepProcessor;
const ast = require('./ast.js');
const StackedSentenceHistory = require('./StackedSentenceHistory.js');

const AsyncRun = 'AsyncRun',
	AsyncLastRun = 'AsyncLastRun',
	Editing = 'Editing',
	NonEditing = 'NonEditing',
	Waiting = 'Waiting',
	Quit = 'Quit';



class forStepProcessor extends superClass {

	constructor(rebuild, statement, superVarTable, options) {

		super(rebuild, new StackedSentenceHistory(rebuild.getHistoryStack()), superVarTable);
		this.statement = statement;
		this.varTable = superVarTable;
		this.status = Waiting;
		this.options = options;

		if (!options) {
			this.options = {};
		}


	}


	onEnter() {
		super.onEnter();
		this.history.init();
		this.initialize();
	}

	onExit() {
		if (this.status != Quit)
			this.archiveStatement();
		super.onExit();
	}

	initialize() {
		this.unarchiveStatement();
		this.initializeI();
		this.history.historyIndex =0;

		this.status = this.evaluateExitConditionI() ? Editing : NonEditing;


		if (this.statement.subStatements.length) {
			if (this.options.debug !== 'stepin') {
				this.status = AsyncLastRun;
			}else{
				this.history.rewind();
			}

		}

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

	incrementI() {
		this.varTable.setEntry(this.statement.varName, this.varTable.getEntry(this.statement.varName) + 1);
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

			//runner.call(this);
			this.incrementI();
		}


	}


	processEndStatement() {

		this.status = AsyncLastRun;
		this.stepContext.addToHistory = false;

	}



	processCommand(command) {

		if (command instanceof ast.CustomCommand) {

			switch (command.name) {
				case 'run':
					this.lineHistory.historyIndex = 0; //TODO: not to access the variable
					this.status = AsyncRun;
					this.initializeI();

					break;
				case 'rewind':
					this.stepContext.needToRewindHistory = true;
					break;
				case 'quit':
					this.status = Quit;
					this.markDead();
					break;

				case 'checkback':
					for (var i = this.history.getContent().length - 1; i >= 0; i--) {
						if (this.history.getContent()[i] instanceof ast.executableStatement) {
							break;
						} else {
							this.history.popBack();
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

		var that = this;



		function runner(statement) {

			if (statement instanceof ast.executableStatement) {
				that.processStatement(statement);
			}

		}

		if (this.status === AsyncRun || this.status === AsyncLastRun) {

			return new Promise(resolve => {

				if (this.lineHistory.historyIndex === 0) {
					if (!this.evaluateExitConditionI()) {
						this.initializeI();
						this.lineHistory.rewind();
						if (this.status === AsyncLastRun)
							this.markDead();
						this.status = Editing;



						resolve();
						return;
					}
				}

				runner(this.history.getContent()[this.lineHistory.historyIndex]);
				this.lineHistory.historyIndex++;

				if (this.lineHistory.historyIndex == this.lineHistory.writeHistoryIndex + 1) {
					this.incrementI();
					this.lineHistory.historyIndex = 0;
				}

				resolve();
			});



		} else {

			var self = this;

			self.stepContext = {
				addToHistory: true
			};


			return new Promise(function(resolve) {

				if (self.status === Editing) {

					self.rebuild.getLine({
						history: self.lineHistory,
						prompt: self.setPrompt("for " + self.statement.varName + "}")
					}).then(function(answer) {

						self.processStep(answer);
						resolve();
					});

				} else if (self.status === NonEditing) {

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



	}


	updateHistory(sentence) {

		if (this.stepContext.addToHistory) {
			this.addToHistory(sentence);
		}

		if (this.stepContext.needToRewindHistory) {

			this.history.rewind();
		}

	}

	addToHistory(sentence) {

		const writeContent = this.history.getContent()[this.history.getWriteHistoryIndex()];
		var replace = false;
		if (writeContent instanceof ast.UnProcessedSentence) {
			replace = false;
		} else {
			replace = true;
		}

		this.rebuild.addHistoryEntry(sentence, {
			replace: replace,
			incrementer: (statement => statement instanceof ast.executableStatement ||
				statement instanceof ast.UnProcessedSentence)
		});


	}



}
exports.forStepProcessor = forStepProcessor;