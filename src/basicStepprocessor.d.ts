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
		rebuild: any;
		setPrompt(a: string): void;
		markDead(): void;

		stepContext: any;
	}

}

export = BasicStepProcessor;

