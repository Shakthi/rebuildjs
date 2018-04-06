import basicStepprocessor = require('./basicStepprocessor.js');
import superClass = require('./forIfElseStepProcessor');


import Ast = require('./ast.js');
import stepProcessors = require('./stepprocessor.js');
import StackedSentenceHistory = require('./StackedSentenceHistory.js');
import assert = require('assert');






class forElseStepProcessor extends superClass.forIfElseStepProcessor {

	forStatement: Ast.forStatement;



	constructor(rebuild: any, statement: Ast.forStatement,
		superVarTable: any,
		options: any) {
		super(rebuild, statement, superVarTable, options);
		this.forStatement = statement;

	}


	initializeI() {
		var beginvalue = this.forStatement.fromExpression.evaluate(this.varTable);
		this.varTable.setEntry(this.forStatement.varName, beginvalue);
	}


	getIValue() {
		return this.varTable.getEntry(this.forStatement.varName);
	}

	evaluateExitConditionI(): boolean {
		//var beginvalue = this.statement.toExpression.evaluate(this.varTable);
		var endvalue = this.forStatement.toExpression.evaluate(this.varTable);
		var forValue = this.getIValue();

		return (forValue <= endvalue);
	}


	incrementI() {
		this.varTable.setEntry(this.forStatement.varName, this.varTable.getEntry(this.forStatement.varName) + 1);
	}

	initialize() {
		this.initializeI();
		this.mode = this.evaluateExitConditionI() ? superClass.Mode.If : superClass.Mode.Else;
		super.initialize();

	}






	async runStep(argument: any): Promise<void> {

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



		switch (this.status) {
			case superClass.Status.Dead:
				return Promise.resolve();
			case superClass.Status.Run:
				if (this._isMature()) {
					if (this.lineHistory.historyIndex >= this.lineHistory.writeHistoryIndex) {
						if (this.lineHistory.historyIndex == 0) {
							that.rebuild.console.log("!!Edit please ");
							this.status = superClass.Status.Edit;
							this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
						}
						else {
							this.incrementI();
							this.lineHistory.historyIndex = 0;
							if (!this.evaluateExitConditionI()) {
								this.status = superClass.Status.Dead;
								this.markDead();
							}
						}
						return Promise.resolve();
					} else {

						const ret = runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
						if (ret && ret.debuggerTrap) {
							this.status = superClass.Status.Edit;
							this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
						}
						else {
							this.lineHistory.historyIndex++;
						}
						return Promise.resolve();
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
						return Promise.resolve();
					} else {

						const ret = runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
						if (ret && ret.debuggerTrap) {
							this.status = superClass.Status.Edit;
							this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
						}
						else {
							this.lineHistory.historyIndex++;
						}
						return Promise.resolve();
					}

				}


			case superClass.Status.Edit:

				this.stepContext = {
					addToHistory: true
				};

				if (this._isMature()) {

					const answer: basicStepprocessor.answer = await this.rebuild.getLine({
						history: this.lineHistory,
						prompt: this.setPrompt("for " + this.forStatement.varName + "}"),
						macros: this.macros
					});

					this.processStep(answer);
					return Promise.resolve();


				} else {

					const answer: basicStepprocessor.answer = this.rebuild.getLine({
						history: this.lineHistory,
						prompt: this.setPrompt("forelse }"),
						macros: this.macros
					})

					this.processElseStatement(answer);
					return Promise.resolve();
				}

			default:
				assert(false, "should not come here");
		}




	}





}




exports.forElseStepProcessor = forElseStepProcessor;