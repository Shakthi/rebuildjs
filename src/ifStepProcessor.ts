import basicStepprocessor = require('./basicStepprocessor.js');
import Ast = require('./ast.js');
import stepProcessors = require('./stepprocessor.js');
import StackedSentenceHistory = require('./StackedSentenceHistory.js');
import superClass = require('./forIfElseStepProcessor');
import assert = require('assert');



class ifStepProcessor extends superClass.forIfElseStepProcessor {
	ifStatement: Ast.ifStatement;

	constructor(rebuild: any, statement: Ast.ifStatement,
		superVarTable: any,
		options: any) {

		super(rebuild, statement, superVarTable, options);
		this.ifStatement = statement;
	}


	onEnter() {
		super.onEnter();
		
	}

	onExit() {
		super.onExit();
	}
	
	evaluateCondition() {
		//var beginvalue = this.statement.toExpression.evaluate(this.varTable);
		return this.ifStatement.condition.evaluate(this.varTable);

	}

	initialize() {
		super.initialize();
	}

	




	runStep(argument: any) {

		var that = this;

		if (argument == stepProcessors.DeathReason.abort) {
			this.status = superClass.Status.Edit;
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
				case superClass.Status.Dead:
					resolve();
					break;
				case superClass.Status.Run:
					if (this._isMature()) {
						if (this.lineHistory.historyIndex >= this.lineHistory.writeHistoryIndex) {
							if (this.lineHistory.historyIndex == 0) {
								that.rebuild.console.log("!!Edit please ");
								this.status = superClass.Status.Edit;
								this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
							}
							else {
								this.status = superClass.Status.Dead;
								this.markDead();
							}
							resolve();
						} else {

							const ret = runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
							if (ret && ret.debuggerTrap) {
								this.status = superClass.Status.Edit;
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
								this.status = superClass.Status.Edit;
								this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
							}
							else {
								this.status = superClass.Status.Dead;
								this.markDead();

							}
							resolve();
						} else {

							const ret = runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
							if (ret && ret.debuggerTrap) {
								this.status = superClass.Status.Edit;
								this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
							}
							else {
								this.lineHistory.historyIndex++;
							}
							resolve();
						}

					}

					break;

				case superClass.Status.Edit:

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