import basicStepprocessor = require('./basicStepprocessor.js');
import superClass = require('./forIfElseStepProcessor');


import Ast = require('./ast.js');
import stepProcessors = require('./stepprocessor.js');
import StackedSentenceHistory = require('./StackedSentenceHistory.js');
import assert = require('assert');
import expressionProcessor = require('./ExpressionProcessor');

const Status = superClass.Status;






class forElseStepProcessor extends superClass.forIfElseStepProcessor {

	forStatement: Ast.forStatement;
	originalVarTable: any;

	constructor(rebuild: any, statement: Ast.forStatement,
		superVarTable: any,
		options: any) {
		super(rebuild, statement, superVarTable, options);
		this.forStatement = statement;
		this.originalVarTable = superVarTable;
	}


	*initializeI(): IterableIterator<any> {

		let beginvalue = yield* this.evaluateExpressionAsync(this.forStatement.fromExpression);
		this.varTable.setEntry(this.forStatement.varName, beginvalue);
	}




	getIValue() {
		return this.varTable.getEntry(this.forStatement.varName);
	}

	*evaluateExitConditionI(): IterableIterator<boolean> {

		let endvalue = yield* this.evaluateExpressionAsync(this.forStatement.toExpression);
		var forValue = this.getIValue();

		return (forValue <= endvalue);
	}


	incrementI() {
		this.varTable.setEntry(this.forStatement.varName, this.varTable.getEntry(this.forStatement.varName) + 1);
	}


	//override intialization
	initialize() {


	}





	runStep(argument: any): Promise<void> {
		return this.runGenerater(argument);
	}

	

	 *runStepPositiveAsync_EditState(): IterableIterator<any> {
		
		do {
			this.stepContext.addToHistory = true;

			const answer: basicStepprocessor.answer = yield this.rebuild.getLine({
				history: this.lineHistory,
				prompt: this.setPrompt("for " + this.forStatement.varName + "}"),
				macros: this.macros
			});

			yield * this.processStepAsync(answer);

			yield;
		} while (this.status == superClass.Status.Edit);

	}


	 *runStepNegetiveAsync_EditState(): IterableIterator<any>{


		do {
			this.stepContext.addToHistory = true;

			const answer: basicStepprocessor.answer = yield this.rebuild.getLine({
				history: this.lineHistory,
				prompt: this.setPrompt("forelse }"),
				macros: this.macros
			});

			yield * this.processStepAsync(answer);

			
		} while (this.status == superClass.Status.Edit);

	}


	
	 *runStepPositiveAsync_RunState(): IterableIterator<any> {
		do {
			while (this.lineHistory.historyIndex < this.lineHistory.writeHistoryIndex) {

				const ret = yield* this.runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
				if (ret && ret.debuggerTrap) {

					this.status = superClass.Status.Edit;
					this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;

					return;
				}
				else {
					this.lineHistory.historyIndex++;
				}

				yield;

			}
			if (this.lineHistory.historyIndex == 0) {
				this.rebuild.console.log("!!Edit please ");
				this.status = superClass.Status.Edit;
				this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
				return;
			}

			this.incrementI();
			this.lineHistory.historyIndex = 0;


		} while ((yield* this.evaluateExitConditionI()));

	}




	 *runStepPositiveAsync(): IterableIterator<any> {
		if (this.status == superClass.Status.Run) {
			yield* this.runStepPositiveAsync_RunState();
		}
		
		if (this.status == superClass.Status.Edit) {
			yield* this.runStepPositiveAsync_EditState();
			yield* this.runStepPositiveAsync_RunState(); //End run
		}


	}





	

	* runStepAsync() {

		yield* this.initializeI();
		this.mode = (yield* this.evaluateExitConditionI()) ? superClass.Mode.If : superClass.Mode.Else;
		super.initialize();
		this.stepContext = {};
		if (this.mode === superClass.Mode.If) {

			yield* this.runStepPositiveAsync();

		} else {

			yield* this.runStepNegetiveAsync();


		}

		if(this.status != Status.Dead){
			this.processEndStatement();
		}
		return this.getReturnStepValue();
	}

	
	




}




exports.forElseStepProcessor = forElseStepProcessor;