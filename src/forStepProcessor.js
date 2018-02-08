'use strict';
const superClass = require('./basicStepprocessor.js').BasicStepProcessor;
const ast = require('./ast.js');
const StackedSentenceHistory = require('./StackedSentenceHistory.js');
const Enum = require('enum');


const Status = new Enum(['Idle', 'Edit', 'Run', 'Dead']);



const AsyncRun = 'AsyncRun',
	AsyncLastRun = 'AsyncLastRun',
	Editing = 'Editing',
	NonEditing = 'NonEditing',
	Waiting = 'Waiting',
	Quit = 'Quit';
/* For step is complicated 
There are two factor that contributing its complication
1.It has loop
2.It has a histoy


#Different states of for step
#1. Empty
#2. Has Content
#3. Executable
#4. Not executable

Different states of for step

1. Open or close - Open to add content are closed
2. Ripe or unRipe









*/


class forStepProcessor extends superClass {

	constructor(rebuild, statement, superVarTable, options) {

		super(rebuild, new StackedSentenceHistory(rebuild.getHistoryStack()), superVarTable);
		this.statement = statement;
		this.varTable.superEntry = superVarTable;
		this.status = Status.Idle;
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

	_isClosed() {

		return this.statement.subStatements.length > 0;
	}

	_isMature() {

		return !this.evaluateExitConditionI();
	}

	__isForced() {

		return this.options.debug === 'stepin';
	}



	initialize() {
		this.unarchiveStatement();
		this.initializeI();
		this.history.historyIndex = 0;



		if (this._isClosed() && this._isMature() && !this._isForced()) {
			this.status = Status.Run;
		}

		if (this._isClosed() && this._isMature() && this._isForced()) {

			this.rewind();
			this.status = Status.Edit;
		}

		if (this._isClosed() && !this._isMature() && !this._isForced()) {
			this.status = Status.Dead;

		}

		if (this._isClosed() && !this._isMature() && this._isForced()) {
			this.rewind();
			this.status = Status.Edit;

		}



		if (!this._isClosed() && this._isMature()) {

			this.rewind();
			this.status = Status.Edit;
		}

		if (!this._isClosed() && !this._isMature()) {

			this.rewind();
			this.status = Status.Edit;
		}



	}

	archiveStatement() {


		this.statement.subStatements = [];
		this.history.getContent().forEach(function(statement) {

			if (statement instanceof ast.executableStatement || statement instanceof ast.LineComment) {
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


	processElseStatement(answer) {

		this.processSentence(new ast.LineComment('#' + answer.line));
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

			if (statement instanceof ast.LineComment) {
				return 10;
			}

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

				const ret = runner(this.history.getContent()[this.lineHistory.historyIndex]);
				if (ret) {
					this.status = Editing;
					this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
				} else {
					this.lineHistory.historyIndex++;

					if (this.lineHistory.historyIndex == this.lineHistory.writeHistoryIndex + 1) {
						this.incrementI();
						this.lineHistory.historyIndex = 0;
					}
				}

				resolve();
			});



		} else {


			that.stepContext = {
				addToHistory: true
			};


			return new Promise(function(resolve) {

				if (that.status === Editing) {

					that.rebuild.getLine({
						history: that.lineHistory,
						prompt: that.setPrompt("for " + that.statement.varName + "}")
					}).then(function(answer) {

						that.processStep(answer);
						resolve();
					});

				} else if (that.status === NonEditing) {

					that.rebuild.getLine({
						history: that.lineHistory,
						prompt: that.setPrompt("for end}")
					}).then(function(answer) {

						that.processElseStatement(answer);
						that.markDead();
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