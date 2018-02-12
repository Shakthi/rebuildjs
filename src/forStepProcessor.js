'use strict';
const superClass = require('./basicStepprocessor.js').BasicStepProcessor;
const ast = require('./ast.js');

const StackedSentenceHistory = require('./StackedSentenceHistory.js');
const Enum = require('enum');
const assert = require('assert');


const Status = new Enum(['Idle', 'Edit', 'Run', 'LastRun', 'Dead', 'Quit']);



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
		this.status = Status.Idle;
		this.options = options;
		this.macros += "u";


		if (!options) {
			this.options = {};
		}


	}


	onEnter() {
		super.onEnter();
		this.lineHistory.init();
		this.initialize();
	}

	onExit() {
		if (this.status != Status.Quit)
			this.archiveStatement();
		super.onExit();
	}

	_isClosed() {

		return this.statement.subStatements.length > 0;
	}

	_isMature() {

		return this.evaluateExitConditionI();
	}

	_isForced() {

		return this.options.debug === 'stepin';
	}



	initialize() {
		this.unarchiveStatement();
		this.initializeI();
		this.lineHistory.historyIndex = 0;



		if (this._isClosed() && this._isMature() && !this._isForced()) {
			this.status = Status.LastRun;
		}



		if (this._isClosed() && !this._isMature() && !this._isForced() ) {
			this.status = Status.Dead;
			this.markDead();
		}



		if (!this._isClosed() || this._isForced() ) {

			this.lineHistory.rewind();
			this.status = Status.Edit;
		}


		assert(this.status != Status.Idle);


	}

	archiveStatement() {


		this.statement.subStatements = [];
		this.lineHistory.getContent().forEach(function(statement) {

			if (statement instanceof ast.executableStatement || statement instanceof ast.LineComment) {
				this.statement.subStatements.push(statement);
			}

		}, this);
	}

	unarchiveStatement() {

		this.statement.subStatements.forEach(function(argument) {
			this.lineHistory._internalAdd(argument);
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

			this.lineHistory.getContent().forEach(runner, this);

			//runner.call(this);
			this.incrementI();
		}


	}


	processByMacros(answer) {
		if (!answer.key)
			return answer;

		var answer2 = answer;
		switch (answer.key.name) {
			case 'u':
				answer2.line = '.checkback';
				this.stepContext.traceParsed = false;

				break;

			

			default:
				answer2 = super.processByMacros(answer2);
		}

		return answer2;

	}
	processEndStatement() {

		this.status = Status.LastRun;
		this.stepContext.addToHistory = false;

	}


	processElseStatement(answer) {

		this.processSentence(new ast.LineComment(answer.line));
	}



	processCommand(command) {

		if (command instanceof ast.CustomCommand) {

			switch (command.name) {
				case 'run':
					this.lineHistory.historyIndex = 0; //TODO: not to access the variable
					this.status = Status.Run;
					this.initializeI();

					break;
				case 'rewind':
					this.stepContext.needToRewindHistory = true;
					break;
				case 'quit':
					this.status = Status.Quit;
					this.markDead();
					break;

				case 'checkback':
					for (var i = this.lineHistory.getContent().length - 1; i >= 0; i--) {
						if (this.lineHistory.getContent()[i] instanceof ast.executableStatement) {
							break;
						} else {
							this.lineHistory.popBack();
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

		return new Promise(resolve => {


			switch (this.status) {
				case Status.Dead:
					resolve();
					break;
				case Status.Run:
				case Status.LastRun:
					const ret = runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
					if (ret) {
						this.status = Status.Edit;
						this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
					} else {
						this.lineHistory.historyIndex++;

						if (this.lineHistory.historyIndex == this.lineHistory.writeHistoryIndex + 1) {
							this.incrementI();
							this.lineHistory.historyIndex = 0;


							if (!this._isMature()) {

								if (this.status == Status.LastRun) {
									this.status = Status.Dead;
									this.markDead();
								} else {
									this.initializeI();
									this.lineHistory.rewind();
									this.status = Status.Edit;
								}
							}
						}
					}
					resolve();
					break;

				case Status.Edit:

					this.stepContext = {
						addToHistory: true
					};

					if (this._isMature()) {

						this.rebuild.getLine({
							history: this.lineHistory,
							prompt: this.setPrompt("for " + that.statement.varName + "}"),
							macros: this.macros
						}).then(answer => {

							this.processStep(answer);
							resolve();

						});

					} else {

						this.rebuild.getLine({
							history: this.lineHistory,
							prompt: this.setPrompt("for end}")
						}).then(answer => {

							this.processElseStatement(answer);
							this.markDead();
							resolve();


						});

					}
					break;


				default:
					assert(false, "should not come here");


			}

		});



	}


	updateHistory(sentence) {

		if (this.stepContext.addToHistory) {
			this.addToHistory(sentence);
		}

		if (this.stepContext.needToRewindHistory) {

			this.lineHistory.rewind();
		}

	}

	addToHistory(sentence) {

		const writeContent = this.lineHistory.getContent()[this.lineHistory.getWriteHistoryIndex()];
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