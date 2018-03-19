// Type definitions for ./src/ast.js
// Project: [LIBRARY_URL_HERE] 
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]> 
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare namespace astNameSpace {

	class Sentence {
		constructor();

		toCode(): string;
		isEqual(aSentence: Sentence): boolean;

		clone(): Sentence;
	}


	class Statement extends Sentence {


	}

	class Command extends Sentence {

	}

	class CustomCommand extends Command {

		constructor(name: string);
		name: string;
	}


	class UnProcessedSentence extends Sentence {


	}



	class errorStatement extends Statement {

		constructor(message: string, found: string, expected: string);

	}



	class executableStatement extends Statement {



	}



	class LineComment extends executableStatement {

		constructor(message: string)


	}


	class DebuggerTrap extends executableStatement {

		constructor(message: string, oldSentence: string);
		message: string;

	}


	class ifStatement extends executableStatement {
		constructor(condition: expression);
		condition: expression;
		subStatements: Sentence[];
		negetiveSubStatements: Sentence[];
	}


	class forStatement extends executableStatement {

		constructor(varName: string, fromExpression: expression, toExpression: expression);
		subStatements: Sentence[];
		negetiveSubStatements: Sentence[];
		varName: string;
		fromExpression: expression;
		toExpression: expression;
	}


	class printStatement extends executableStatement {

		constructor(elements: expression[]);



	}

	class endStatement extends Statement {
		constructor();
	}


	class readStatement extends executableStatement {

		constructor(elements: string[], prompt: string);
	}


	class letStatement extends executableStatement {

		constructor(varName: string, anexpression: expression);

	}


	class expression {
		evaluate(context: any): any;
	}


	class unaryExpression extends expression {

		constructor(operator: string, left: expression);

	}



	class binaryExpression extends expression {

		constructor(operator: string, left: expression, right: expression);

	}


	class terminalExpression extends expression {

		constructor(terminalValue: any);

	}

	class getExpression extends expression {

		constructor(varName: string);

	}
}

export = astNameSpace;
