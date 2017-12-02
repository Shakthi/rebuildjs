class Serializable {

	toJson() {

		function toJsonEntity(enttity) {
			switch (typeof(enttity)) {
				case 'number':
				case 'string':
				case 'boolean':
					return enttity;


				case 'object':
					if (enttity == null) {
						return enttity;

					} else if (Array.isArray(enttity)) {
						enttity.map(function(argument) {
							return toJsonEntity(argument);
						});
					} else if (enttity) {
						return exports.sentenceToJson(enttity);

					}

			}

		}

		const data = {};

		const self = this;
		this.serialize().forEach(function(argument) {
			data[argument] = toJsonEntity(self[argument]);


		})

		return data;

	}


	fromJson(data) {


		const self = this;
		this.serialize().forEach(function(argument) {
			self[argument] = data[argument];
		})

	}


	serialize() {
		const ret = [];
		ret.add = function() {
			const args = Array.from(arguments);
			args.forEach(function(argument) {
				ret.push(argument);
			})
			return this;
		}
		return ret;
	}

}



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

	serialize() {
		return super.serialize().add('src');
	}

};


class Statement extends Sentence {


};

class UnProcessedSentence extends Sentence {


};



class errorStatement extends Statement {

	constructor(message, found, expected) {
		super();
		Object.assign(this, {
			message,
			found,
			expected
		});
	}


	serialize() {
		return super.serialize().add('message');
	}


};



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

	serialize(attributes) {
		return super.serialize().add('varName', 'fromExpression', 'toExpression');
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

			if (i != 0)
				code += ", ";

			code += this.elements[i].toCode();
		}

		//code += ";"
		return code;
	}

};

class endStatement extends Statement {
	constructor(elements, prompt) {
		super();
	}
	toCode() {

		return "end";
	}
};


class readStatement extends Statement {

	constructor(elements, prompt) {
		super();
		this.elements = elements;
		this.prompt = prompt;
	}

	toCode() {
		var code = "read ";
		for (var i = 0; i < this.elements.length; i++) {

			if (i != 0)
				code += ", ";
			code += this.elements[i];
		}



		//code += ";"
		return code;
	}

};


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

};


class expression extends Serializable {


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
			case 'UMINUS':
				return -this.argument.evaluate(context);
			case 'GROUP':
				return this.argument.evaluate(context);

		}



	}

}


class unaryExpression extends expression {

	constructor(operator, left) {
		super();
		this.argument = left;
		this.operator = operator;
	}

	serialize() {
		return super.serialize().add('argument', 'operator');
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

	serialize() {
		return super.serialize().add('terminalValue');
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



exports.createSentence = function(name) {

	return Object.create(exports[name].prototype);
}


exports.createSentenceFromJson = function(json) {

	const object = exports.createSentence(json.constructorName);
	object.fromJson(json.content);

	return object;
}

exports.sentenceToJson = function(sentence) {

	data = {
		constructorName: sentence.constructor.name,
		content: sentence.toJson()

	};

	return data;
}



exports.getExpression = getExpression;
exports.errorStatement = errorStatement;
exports.terminalExpression = terminalExpression;
exports.unaryExpression = unaryExpression;
exports.binaryExpression = binaryExpression;
exports.letStatement = letStatement;
exports.readStatement = readStatement;
exports.printStatement = printStatement;
exports.endStatement = endStatement;
exports.forStatement = forStatement;
exports.UnProcessedSentence = UnProcessedSentence;