import basicStepprocessor = require('./basicStepprocessor.js');
import Ast = require('./ast.js');
import stepProcessors = require('./stepprocessor.js');
import StackedSentenceHistory = require('./StackedSentenceHistory.js');
enum Status {
	Idle, Edit, Run, Dead, Quit
};

import assert = require('assert');


enum Mode { If, Else, Undecided };

class ifStepProcessor extends basicStepprocessor.BasicStepProcessor {
	mode: Mode;
	status: Status;

	constructor(rebuild: any, private statement: Ast.ifStatement,
		superVarTable: any,
		private options: any) {

		super(rebuild, new StackedSentenceHistory(rebuild.getHistoryStack()), superVarTable);

		this.macros += "u";
		this.mode = Mode.Undecided;
		this.status = Status.Edit;

		if (!this.options) {
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
		if (!this._isForced()) {
			this.status = Status.Run;
		} else {
			this.lineHistory.rewind();
			this.status = Status.Edit;
		}


		this.lineHistory.historyIndex = 0;
	}

	archiveStatement(): void {

		if (this.mode == Mode.If) {
			this.statement.subStatements = [];

		} else {
			this.statement.negetiveSubStatements = [];
		}
		this.lineHistory.getContent().forEach((statement: Ast.Sentence) => {

			if (statement instanceof Ast.executableStatement) {
				if (this.mode == Mode.If) {
					this.statement.subStatements.push(statement);

				} else {
					this.statement.negetiveSubStatements.push(statement);
				}
			}

		});
	}


	unarchiveStatement(isTrue: boolean) {
		if (isTrue) {

			this.statement.subStatements.forEach((argument: Ast.Sentence) => {
				this.lineHistory._internalAdd(argument);
			});


		} else {
			this.statement.negetiveSubStatements.forEach((argument: Ast.Sentence) => {
				this.lineHistory._internalAdd(argument);
			});

		}


	}

	_isMature() {

		return this.mode == Mode.If;
	}

	processElseStatement(answer: basicStepprocessor.answer) {
		this.processStep(answer);
	}





	runStep(argument: any) {

		var that = this;

		if (argument == stepProcessors.DeathReason.abort) {
			this.status = Status.Edit;
			this.lineHistory.historyIndex--;
			this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
		}

		function runner(statement: Ast.Statement) {

			if (statement instanceof Ast.DebuggerTrap) {
				const debuggerTrapStatment = statement as Ast.DebuggerTrap;
				that.rebuild.console.log("!!Trapped - " + debuggerTrapStatment.message);
				return {
					debuggerTrap: true
				};

			}



			if (statement instanceof Ast.executableStatement) {
				that.processStatement(statement);
			}

		}

		return new Promise<void>((resolve: any) => {


			switch (this.status) {
				case Status.Dead:
					resolve();
					break;
				case Status.Run:
					if (this._isMature()) {
						if (this.lineHistory.historyIndex >= this.lineHistory.writeHistoryIndex) {
							if (this.lineHistory.historyIndex == 0) {
								that.rebuild.console.log("!!Edit please ");
								this.status = Status.Edit;
								this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
							}
							else {
								this.status = Status.Dead;
								this.markDead();
							}
							resolve();
						} else {

							const ret = runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
							if (ret && ret.debuggerTrap) {
								this.status = Status.Edit;
								this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
							}
							else {
								this.lineHistory.historyIndex++;
							}
							resolve();
						}
					} else {

						///This where we are entering when else part of the for subjuect to tun 
						if (this.lineHistory.historyIndex >= this.lineHistory.writeHistoryIndex) { //End of loop
							if (this.lineHistory.historyIndex == 0) { //Empty else part
								that.rebuild.console.log("!!Edit please ");
								this.status = Status.Edit;
								this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
							}
							else {
								this.status = Status.Dead;
								this.markDead();

							}
							resolve();
						} else {

							const ret = runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
							if (ret && ret.debuggerTrap) {
								this.status = Status.Edit;
								this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
							}
							else {
								this.lineHistory.historyIndex++;
							}
							resolve();
						}

					}

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
						}).then((answer: basicStepprocessor.answer) => {

							this.processStep(answer);
							resolve();

						});

					} else {

						this.rebuild.getLine({
							history: this.lineHistory,
							prompt: this.setPrompt("else }"),
							macros: this.macros

						}).then((answer: basicStepprocessor.answer) => {

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



	updateHistory(sentence: Ast.Sentence) {

		if (this.stepContext.addToHistory) {
			this.addToHistory(sentence);
		}

		if (this.stepContext.needToRewindHistory) {

			this.lineHistory.rewind();
		}

	}

	addToHistory(sentence: Ast.Sentence) {

		const writeContent = this.lineHistory.getContent()[this.lineHistory.getWriteHistoryIndex()];
		var replace = false;
		if (writeContent instanceof Ast.UnProcessedSentence) {
			replace = false;
		} else {
			replace = true;
		}

		this.rebuild.addHistoryEntry(sentence, {
			replace: replace,
			incrementer: (statement: Ast.Statement) => statement instanceof Ast.executableStatement ||
				statement instanceof Ast.UnProcessedSentence
		});


	}


}

exports.ifStepProcessor = ifStepProcessor;