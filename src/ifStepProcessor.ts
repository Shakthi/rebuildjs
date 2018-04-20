import basicStepprocessor = require('./basicStepprocessor.js');
import Ast = require('./ast.js');
import stepProcessors = require('./stepprocessor.js');
import StackedSentenceHistory = require('./StackedSentenceHistory.js');
import superClass = require('./forIfElseStepProcessor');
import expressionProcessor = require('./ExpressionProcessor');
import assert = require('assert');
const Status = superClass.Status;

enum InitStatus {
	Idle,
	Initializing,
	Running
};



class ifStepProcessor extends superClass.forIfElseStepProcessor {
	ifStatement: Ast.ifStatement;
	initStatus: InitStatus;//Additional status to handle seperate expression evaluation
	originalVarTable: any;

	constructor(rebuild: any, statement: Ast.ifStatement,
		superVarTable: any,
		options: any) {
		super(rebuild, statement, superVarTable, options);
		this.setPrompt("if }");

		this.initStatus = InitStatus.Idle;
		this.ifStatement = statement;
		this.originalVarTable = superVarTable;// This we  need to store becuase
		// conditional is excuted in outside the block context

	}



	evaluateCondition() {
		//var beginvalue = this.statement.toExpression.evaluate(this.varTable);
		return this.ifStatement.condition.evaluate(this.varTable);
	}

	initialize() {
	}

	postEvalinitialize(result: boolean) {
		//this.mode = this.evaluateCondition() ? superClass.Mode.If : superClass.Mode.Else;
		this.mode = result ? superClass.Mode.If : superClass.Mode.Else;
		super.initialize();

	}




	* runStepAsync():IterableIterator<void> {

		this.postEvalinitialize( yield* this.evaluateExpressionAsync(this.ifStatement.condition,this.originalVarTable));
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


	runStep(argument: any): Promise<void> {
		return this.runGenerater(argument);
	}





	 *runStepPositiveAsync_EditState(): IterableIterator<any> {
		
		do {
			this.stepContext.addToHistory = true;

			const answer: basicStepprocessor.answer = yield this.rebuild.getLine({
				history: this.lineHistory,
				prompt: this.setPrompt("if }"),
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
				prompt: this.setPrompt("else }"),
				macros: this.macros
			});

			yield * this.processStepAsync(answer);

			
		} while (this.status == superClass.Status.Edit);

	}



	 *callProcessorAsync(processor: basicStepprocessor.BasicStepProcessor): any {

         var result  = yield * super.callProcessorAsync(processor);
            switch (result.type) {
                case 'returnStatement':
                this.returnStep(result.value);                    
                    break;
            
                default:
                    break;
            }


    }
	
	

	processEndStatement() {
        this.status = Status.Dead;
		this.stepContext.addToHistory = false;
		super.processEndStatement();
    }


}

exports.ifStepProcessor = ifStepProcessor;