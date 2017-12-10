"use strict";

const Serializable = require('../../simple-serial-js/');

const ast = {};
class Sentence extends Serializable {
	constructor() {
		super();
		this.src = "";
	}

	toCode() {
		return this.src;
	}

	isEqual(aSentence) {
		return this.toCode() === aSentence.toCode();
	}



	factory() {
		return ast;
	}


	clone() {

		const newObject = Object.create(this.constructor.prototype);
		newObject.fromJson(this.toJson());

		return newObject;

	}



}


class Statement extends Sentence {


}

class Command extends Sentence {

}

class CustomCommand extends Command {

	constructor(name) {
		super();
		this.name = name;
	}

}


class UnProcessedSentence extends Sentence {


}



class errorStatement extends Statement {

	constructor(message, found, expected) {
		super();
		Object.assign(this, {
			message,
			found,
			expected
		});
	}



}



class forStatement extends Statement {

	constructor(varName, fromExpression, toExpression) {
		super();
		this.varName = varName;
		this.fromExpression = fromExpression;
		this.toExpression = toExpression;
	}

	toCode() {
		var code = "for " + this.varName + " = " + this.fromExpression.toCode() + " to " + this.toExpression.toCode();
		return code;
	}



}


class printStatement extends Statement {

	constructor(elements) {
		super();
		this.elements = elements;
	}


	toCode() {
		var code = "print ";
		for (var i = 0; i < this.elements.length; i++) {

			if (i !== 0)
				code += ", ";

			code += this.elements[i].toCode();
		}

		//code += ";"
		return code;
	}

}

class endStatement extends Statement {
	constructor() {
		super();
	}
	toCode() {

		return "end";
	}
}


class readStatement extends Statement {

	constructor(elements, prompt) {
		super();
		this.elements = elements;
		this.prompt = prompt;
	}


	toCode() {
		var code = "read ";
		for (var i = 0; i < this.elements.length; i++) {

			if (i !== 0)
				code += ", ";
			code += this.elements[i];
		}



		//code += ";"
		return code;
	}

}


class letStatement extends Statement {

	constructor(varName, anexpression) {
		super();
		this.varName = varName;
		this.expression = anexpression;
	}


	toCode() {
		var code = "let " + this.varName + " = " + this.expression.toCode();
		return code;
	}

}


class expression extends Serializable {


	evaluate(context) {
		if (this.terminalValue) {
			return this.terminalValue;
		}

		switch (this.operator) {
			case '+':
				return this.left.evaluate(context) + this.right.evaluate(context);
			case '-':
				return this.left.evaluate(context) - this.right.evaluate(context);
			case '*':
				return this.left.evaluate(context) * this.right.evaluate(context);
			case '/':
				return this.left.evaluate(context) / this.right.evaluate(context);
			case 'UMINUS':
				return -this.argument.evaluate(context);
			case 'GROUP':
				return this.argument.evaluate(context);

		}



	}


	factory() {
		return ast;
	} 

}


class unaryExpression extends expression {

	constructor(operator, left) {
		super();
		this.argument = left;
		this.operator = operator;
	}



	toCode() {

		var code = "";

		switch (this.operator) {
			case 'UMINUS':
				code = '-' + this.argument.toCode();
				break;
			case 'GROUP':
				code = '(' + this.argument.toCode() + ')';
				break;
		}
		return code;
	}
}



class binaryExpression extends expression {

	constructor(operator, left, right) {
		super();
		this.operator = operator;
		this.left = left;
		this.right = right;

	}

	toCode() {
		var code = this.left.toCode() + ' ' + this.operator + ' ' + this.right.toCode();
		return code;
	}



}


class terminalExpression extends expression {

	constructor(terminalValue) {
		super();
		this.terminalValue = terminalValue;

	}


	toCode() {
		var code = "";
		if (typeof this.terminalValue === 'string') {
			code += '"' + this.terminalValue + '"';
		} else {
			code += this.terminalValue;
		}

		return code;
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

	toCode() {
		var code = this.varName;
		return code;
	}


}



ast.createSentence = function(name) {

	return Object.create(ast[name].prototype);
};


ast.createSentenceFromJson = function(json) {

	const object = ast.createSentence(json.constructorName);
	object.fromJson(json.content);

	return object;
};

ast.sentenceToJson = function(sentence) {

	var data = {
		constructorName: sentence.constructor.name,
		content: sentence.toJson()

	};

	return data;
};



ast.getExpression = getExpression;
ast.errorStatement = errorStatement;
ast.terminalExpression = terminalExpression;
ast.unaryExpression = unaryExpression;
ast.binaryExpression = binaryExpression;
ast.letStatement = letStatement;
ast.readStatement = readStatement;
ast.printStatement = printStatement;
ast.endStatement = endStatement;
ast.forStatement = forStatement;
ast.UnProcessedSentence = UnProcessedSentence;
ast.CustomCommand = CustomCommand;
ast.Command = Command;
ast.Statement = Statement;


module.exports = ast;