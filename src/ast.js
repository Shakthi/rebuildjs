"use strict";

const Serializable = require('simple-serial-js');
const assert = require('assert');

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



class executableStatement extends Statement {



}

class PassStatement extends executableStatement {

}


class LineComment extends executableStatement {

	constructor(message) {
		super();
		this.message = message;
	}

	toCode() {
		var code = "#" + this.message;
		return code;
	}

}


class DebuggerTrap extends executableStatement {

	constructor(message, oldSentence) {
		super();
		Object.assign(this, {
			message,
			oldSentence,
		});
	}

	toCode() {
		var code = this.oldSentence ? this.oldSentence.toCode() : "";
		return code;
	}

}


class ifStatement extends executableStatement {
	constructor(condition) {
		super();
		this.condition = condition;
		this.subStatements = [];
		this.negetiveSubStatements = [];

	}


	toCode() {
		var code = "if " + this.condition.toCode();
		if (this.subStatements && this.subStatements.length) {
			code += ":";
		} else if (this.negetiveSubStatements && this.negetiveSubStatements.length) {
			code += ";";
		}
		return code;
	}

}


class forStatement extends executableStatement {

	constructor(varName, fromExpression, toExpression) {
		super();
		this.varName = varName;
		this.fromExpression = fromExpression;
		this.toExpression = toExpression;
		this.subStatements = [];
		this.negetiveSubStatements = [];

	}

	toCode() {
		var code = "for " + this.varName + " = " + this.fromExpression.toCode() + " to " + this.toExpression.toCode();
		if (this.subStatements && this.subStatements.length) {
			code += ":";
		}
		return code;
	}



}

class returnStatement extends executableStatement {
	constructor(expression) {
		super();
		this.expression = expression;
	}

	toCode() {
		var code = "return ";

		code += this.expression.toCode();

		//code += ";"
		return code;
	}

}

class printStatement extends executableStatement {

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


class readStatement extends executableStatement {

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


class letStatement extends executableStatement {

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



class argument extends Serializable {

	constructor(id,value){
		super();
		this.id =id;
		this.value = value;		
	}

	factory() {
		return ast;
	}
}

class functionDefine extends executableStatement {

	constructor(name, argumentList) {
		super();
		this.name = name;
		this.argumentList = [];
		argumentList.forEach((arg)=>{
			this.argumentList.push(new argument(arg.id,arg.value));
		});

		this.subStatements = [];
		this.negetiveSubStatements = [];

		
	}


	toCode() {
		//var code = "let " + this.varName + " = " + this.expression.toCode();
		return "";
	}

}



class expression extends Serializable {


	evaluate(context) {
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





class functionExpression extends expression {
	constructor(name, parameters) {
		super();
		this.parameters = parameters;
		this.name = name;
		this.subStatements = [];
		this.negetiveSubStatements = [];

	}



	toCode() {
		var code = this.name + "(";
		for (var i = 0; i < this.parameters.length; i++) {

			if (i !== 0)
				code += ", ";

			code += this.parameters[i].toCode();
		}

		code += ")"
		return code;
	}

	to3AdressCode(counter, irStack) {
		var paramno = [];
		for (var i = 0; i < this.parameters.length; i++) {
			paramno[i] = this.parameters[i].to3AdressCode(counter, irStack);
			counter = paramno[i];
		}


		counter++;

		var msg = "t" + counter + " = " + this.name + "("
		for (var i = 0; i < this.parameters.length; i++) {
			msg += (i != 0) ? "," : "" + "t" + paramno;
		}
		msg += ")"
		irStack.push(msg);
		return counter;
	}


	toPostFix(irStack) {
		for (var i = 0; i < this.parameters.length; i++) {
			this.parameters[i].toPostFix(irStack);
		}
		irStack.push("CALL " + this.name);
	}


	toPostFixCode(irStack) {
		for (var i = 0; i < this.parameters.length; i++) {
			this.parameters[i].toPostFixCode(irStack);
		}
		irStack.push(this);
	}


	execute(context, stack) {
		var argumentList = [];
		for (var i = this.parameters.length; i >0; i--) {
			argumentList[i-1] = stack.pop();
		}
		return { type: 'externalFunction', function: this, argumentList: argumentList };
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

	to3AdressCode(counter, irStack) {
		var t1n = this.argument.to3AdressCode(counter, irStack);


		switch (this.operator) {
			case 'UMINUS':
				counter = t1n + 1;
				irStack.push("t" + counter + " = -" + t1n);
				break;
			case 'GROUP':
				counter = t1n;
				//irStack.push("t" + counter + " =  t"+ t1n );
				break;
		}
		return counter;
	}


	toPostFix(irStack) {
		this.argument.toPostFix(irStack);
		switch (this.operator) {
			case 'UMINUS':
				irStack.push("UMINUS");
				break;
			case 'GROUP':
				break;
		}

	}


	evaluate(context) {


		switch (this.operator) {


			case 'UMINUS':
				return -this.argument.evaluate(context);
			case 'GROUP':
				return this.argument.evaluate(context);
			default:
				assert(false, 'should not come here');
		}
	}


	toPostFixCode(irStack) {
		this.argument.toPostFixCode(irStack);

		if (this.operator == 'UMINUS') {
			irStack.push(this);
		}

	}

	execute(context, stack) {
		switch (this.operator) {
			case 'UMINUS':
				stack.push(-stack.pop());
				break;
			case 'GROUP':
			default:
				assert(false, 'should not come here');
		}
	}
}



class binaryExpression extends expression {

	constructor(operator, left, right) {
		super();
		this.operator = operator;
		this.left = left;
		this.right = right;

	}

	evaluate(context) {

		switch (this.operator) {
			case '+':
				return this.left.evaluate(context) + this.right.evaluate(context);
			case '-':
				return this.left.evaluate(context) - this.right.evaluate(context);
			case '*':
				return this.left.evaluate(context) * this.right.evaluate(context);
			case '/':
				return this.left.evaluate(context) / this.right.evaluate(context);
			case '==':
				return this.left.evaluate(context) == this.right.evaluate(context);
			case '!=':
				return this.left.evaluate(context) != this.right.evaluate(context);
			case '<':
				return this.left.evaluate(context) < this.right.evaluate(context);
			case '>':
				return this.left.evaluate(context) > this.right.evaluate(context);
			case '<=':
				return this.left.evaluate(context) <= this.right.evaluate(context);
			case '>=':
				return this.left.evaluate(context) >= this.right.evaluate(context);

			default:
				assert(false, 'should not come here');
		}



	}


	toCode() {
		var code = this.left.toCode() + ' ' + this.operator + ' ' + this.right.toCode();
		return code;
	}

	to3AdressCode(counter, irStack) {
		var t1n = this.left.to3AdressCode(counter, irStack);
		var t2n = this.right.to3AdressCode(t1n, irStack);
		counter = t2n + 1;

		irStack.push("t" + counter + " = t" + t1n + this.operator + " t" + t2n);
		return counter;
	}

	toPostFix(irStack) {
		this.left.toPostFix(irStack);
		this.right.toPostFix(irStack);
		irStack.push("OPERATE " + this.operator);
	}

	toPostFixCode(irStack) {
		this.left.toPostFixCode(irStack);
		this.right.toPostFixCode(irStack);
		irStack.push(this);
	}

	execute(context, stack) {

		switch (this.operator) {
			case '+':
				stack.push(stack.pop() + stack.pop());
				break;
			case '-':
				stack.push(-stack.pop() + stack.pop());
				break;
			case '*':
				stack.push(stack.pop() * stack.pop());
				break;
			case '/':
				stack.push(1 / stack.pop() * stack.pop());
				break;
			case '==':
				stack.push(stack.pop() == stack.pop());
				break;
			case '!=':
				stack.push(stack.pop() != stack.pop());
				break;
			case '<':
				stack.push(stack.pop() > stack.pop());
				break;
			case '>':
				stack.push(stack.pop() < stack.pop());
				break;
			case '<=':
				stack.push(stack.pop() >= stack.pop());
				break;
			case '>=':
				stack.push(stack.pop() <= stack.pop());


			default:
				assert(false, 'should not come here');
		}
	}



}


class terminalExpression extends expression {

	constructor(terminalValue) {
		super();
		this.terminalValue = terminalValue;

	}

	evaluate(context) {
		return this.terminalValue;
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


	to3AdressCode(counter, irStack) {
		counter++;

		irStack.push("t" + counter + " = " + this.terminalValue);
		return counter;
	}


	toPostFix(irStack) {
		irStack.push("LOAD " + this.terminalValue);
	}

	toPostFixCode(irStack) {
		irStack.push(this);
	}
	execute(context, stack) {
		stack.push(this.terminalValue);
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

	evaluate(context) {
		return context.getEntry(this.varName);
	}

	execute(context, stack) {
		stack.push(context.getEntry(this.varName));
	}

	toCode() {
		var code = this.varName;
		return code;
	}

	to3AdressCode(counter, irStack) {
		counter++;
		irStack.push("t" + counter + " = " + this.varName);
		return counter;
	}

	toPostFix(irStack) {
		irStack.push("LOAD " + this.varName);
	}


	toPostFixCode(irStack) {
		irStack.push(this);
	}



}



ast.createSentence = function (name) {

	return Object.create(ast[name].prototype);
};


ast.createSentenceFromJson = function (json) {

	const object = ast.createSentence(json.constructorName);
	object.fromJson(json.content);

	return object;
};

ast.sentenceToJson = function (sentence) {

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
ast.LineComment = LineComment;
ast.DebuggerTrap = DebuggerTrap;
ast.Statement = Statement;
ast.functionDefine = functionDefine;

ast.executableStatement = executableStatement;
ast.ifStatement = ifStatement;
ast.PassStatement = PassStatement;
ast.functionExpression = functionExpression;
ast.returnStatement = returnStatement;
ast.argument = argument;


module.exports = ast;