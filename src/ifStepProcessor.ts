import {BasicStepProcessor as superClass} from './basicStepprocessor.js';
const ast = require('./ast.js');
const stepProcessors = require('./stepprocessor.js').stepProcessor;
const StackedSentenceHistory = require('./StackedSentenceHistory.js');
const Enum = require('enum');
const assert = require('assert');


const Status = new Enum(['Idle', 'Edit', 'Run', 'LastRun', 'Dead', 'Quit']);
const Mode = new Enum(['If', 'Else', 'Undecided']);

class ifStepProcessor extends superClass {

	constructor(rebuild, statement, superVarTable, options) {

		super(rebuild, new StackedSentenceHistory(rebuild.getHistoryStack()), superVarTable);
		this.statement = statement;
		//this.status = Status.Idle;
		this.options = options;
		this.macros += "u";
		this.mode = Mode.Undecided;
		this.status = Status.Edit;


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
	_isForced() {

		return this.options.debug === 'stepin';
	}
	evaluateCondition() {
		//var beginvalue = this.statement.toExpression.evaluate(this.varTable);
		return this.statement.condition.evaluate(this.varTable);

	}

	initialize() {
 		this.mode = this.evaluateCondition() ? Mode.If : Mode.Else;
		this.unarchiveStatement(this.mode == Mode.If);//Evaluate
		if ( !this._isForced()) {
			this.status = Status.LastRun;
		}else{
			this.lineHistory.rewind();
			this.status = Status.Edit;
		}


		assert(this.status != Status.Idle);
		this.lineHistory.historyIndex = 0;
	}

	archiveStatement() {


		this.statement.subStatements = [];
		this.lineHistory.getContent().forEach(function (statement) {

			if (statement instanceof ast.executableStatement) {
				this.statement.subStatements.push(statement);
			}

		}, this);
	}

	unarchiveStatement(isTrue) {
		if (isTrue) {
			if(this.statement.subStatements.lenght){
				this.statement.subStatements.forEach(function (argument) {
					this.lineHistory._internalAdd(argument);
				}, this);
				
			}else{

					this.statement.subStatements.forEach(function (argument) {
				this.lineHistory._internalAdd(argument);
			}, this);
			
			}
			

		} else {
			this.statement.negetiveSubStatements.forEach(function (argument) {
				this.lineHistory._internalAdd(argument);
			}, this);

		}
		

	}

	_isMature() {

		return this.mode == Mode.If;
	}

	processElseStatement(answer) {
		this.processStep(answer);
	}


	


	runStep(argument) {

		var that = this;

		if (argument == stepProcessors.DeathReason.abort) {
			this.status = Status.Edit;
			this.lineHistory.historyIndex--;
			this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
		}

		function runner(statement) {

			if (statement instanceof ast.DebuggerTrap) {
				that.rebuild.console.log("!!Trapped - " + statement.message);
				return {
					debuggerTrap: true
				};

			}
			
			if (statement instanceof ast.UnProcessedSentence) {
				that.rebuild.console.log("!!Edit please ");
				return {
					debuggerTrap: true
				};
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
					if (ret && ret.debuggerTrap) {
						this.status = Status.Edit;
						this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
					} else {
						this.lineHistory.historyIndex++;

						if (this.lineHistory.historyIndex == this.lineHistory.writeHistoryIndex + 1) {
							this.lineHistory.historyIndex--;

							if (this.status == Status.LastRun) {
								this.status = Status.Dead;
								this.markDead();
							} else {
								this.lineHistory.rewind();
								this.status = Status.Edit;
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
							prompt: this.setPrompt("if }"),
							macros: this.macros
						}).then(answer => {

							this.processStep(answer);
							resolve();

						});

					} else {

						this.rebuild.getLine({
							history: this.lineHistory,
							prompt: this.setPrompt("else }"),
							macros: this.macros

						}).then(answer => {

							this.processElseStatement(answer);
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

exports.ifStepProcessor = ifStepProcessor;