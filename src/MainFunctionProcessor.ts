import FunctionProcessor = require('./FunctionProcessor');
import Ast = require('./ast.js');
import basicStepprocessor = require('./basicStepprocessor.js');
import forIfElseStepProcessor = require('./forIfElseStepProcessor');


const varTable = require('./varTable.js');


class MainFunctionProcessor extends FunctionProcessor {

    constructor(rebuild: any,
        history:any[],
        options: any) {
        super(rebuild,new Ast.functionExpression("main",[]),new varTable(),[],options)

    }
    archiveStatement() {
        
    }
    unarchiveStatement(val:boolean) {
        
    }

    runStep(argument:any) {
        return this.runGenerater(argument);
    }

	 *runStepPositiveAsync_EditState(): IterableIterator<any> {
		
		do {
			this.stepContext.addToHistory = true;

			const answer: basicStepprocessor.answer = yield this.rebuild.getLine({
				history: this.lineHistory,
				prompt: this.setPrompt("main}"),
				macros: this.macros
			});

			yield * this.processStepAsync(answer);

			yield;
		} while (this.status == forIfElseStepProcessor.Status.Edit);

	}
	
}


export = MainFunctionProcessor;
