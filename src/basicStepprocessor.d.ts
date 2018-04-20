// Type definitions for ./src/basicStepprocessor.js
// Project: [LIBRARY_URL_HERE] 
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]> 
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/**
 * 
 */
import StackedSentenceHistory = require('./StackedSentenceHistory');
import Ast = require('./ast');


declare namespace BasicStepProcessor {

	interface answer {
		line: string,
		historyEdited: boolean,
		bufferEdited: boolean,
		key: any
		prefilled: boolean
	}


	class BasicStepProcessor {
		constructor(rebuild: any, history: any, superVarTable: any);
		macros: string;
		lineHistory: StackedSentenceHistory;
		onEnter(): void;
		onExit(): void;
		varTable: any;
		processStep(a: answer): void;
		processStatement(a: Ast.Statement): void;
		processStatementAsync(a: Ast.Statement,options:any): IterableIterator<any>;
		evaluateExpressionAsync(a: Ast.expression,varTable?:any): IterableIterator<any>;
		processStepAsync(a: answer): IterableIterator<any>;
		processByMacros(a: answer): answer;
		
		rebuild: any;
		setPrompt(a: string): void;
		markDead(a?:any,b?:any): void;

		processCommand(a: Ast.Command): void;
		returnStep(result:any): any;
		getReturnStepValue(): any;

		callProcessorAsync(a:BasicStepProcessor):any;

		stepContext: any;
	}

}

export = BasicStepProcessor;

