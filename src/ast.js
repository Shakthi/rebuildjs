class Sentence {


};


class Statement extends Sentence {


};

class printStatement extends Statement {

	constructor(elements) {
		super();
		this.elements = elements;
	}

};


class readStatement extends Statement {

	constructor(elements, prompt) {
		super();
		this.elements = elements;
		this.prompt = prompt;
	}

};


class letStatement extends Statement {

	constructor(varName, anexpression) {
		super();
		this.varName = varName;
		this.expression = anexpression;
	}

};


class expression {

	evaluate(context) {
		if (this.terminalValue) {
			return this.terminalValue;
		}

		switch (this.operator) {
			case '+':
				return this.left.evaluate(context) + this.right.evaluate(context);
				break;
			case '-':
				return this.left.evaluate(context) - this.right.evaluate(context);
				break;
			case '*':
				return this.left.evaluate(context) * this.right.evaluate(context);
				break;
			case '/':
				return this.left.evaluate(context) / this.right.evaluate(context);
				break;
			case 'UMINIUS':
				return -this.argument;
			case 'GROUP':
				return this.argument;

		}



	}

}


class unaryExpression extends expression {

	constructor(operator, left) {
		super();
		this.argument = left;
	}
}



class binaryExpression extends expression {

	constructor(operator, left, right) {
		super();
		this.operator = operator;
		this.left = left;
		this.right = right;

	}
}


class terminalExpression extends expression {

	constructor(terminalValue) {
		super();
		this.terminalValue = terminalValue;

	}

}

class getExpression extends expression {

	constructor(varName) {
		super();
		this.varName = varName;

	}

	evaluate(context) {
		return context.getEntry(this.varName);
	}


}



exports.getExpression = getExpression;
exports.terminalExpression = terminalExpression;
exports.unaryExpression = unaryExpression;
exports.binaryExpression = binaryExpression;
exports.letStatement = letStatement;
exports.readStatement = readStatement;
exports.printStatement = printStatement;