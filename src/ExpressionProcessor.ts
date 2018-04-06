import Ast = require('./ast.js');
import stepProcessors = require('./stepprocessor.js');
import functionProcessors = require('./FunctionProcessor');

const VarTable = require('./varTable.js');


import assert = require('assert');
enum Status { Idle, Execute };

class ExpressionProcessor extends stepProcessors.stepProcessor {
	varTable: any;
	status: Status;
	stackMachineCode: any[];
	execStack: any[];

	constructor(rebuild: any, private expression: Ast.expression,
		superVarTable: any,
		options: any) {
		super(rebuild, null);
		this.varTable = new VarTable();
		this.stackMachineCode = [];
		this.execStack = [];
		if (superVarTable) {
			this.varTable.superEntry = superVarTable;
		}
		this.status = Status.Idle;
	}






	runStep(argument: any): Promise<void> {

		switch (this.status) {
			case Status.Idle://We start converting to 3 address notation
				////this.generate3Address(this.expression);
				var a: any[] = [];
				this.expression.to3AdressCode(0, a);
				this.rebuild.console.log(a);
				this.expression.toPostFixCode(this.stackMachineCode);
				this.status = Status.Execute;
				return Promise.resolve();

			case Status.Execute:
				try {
					this.stackMachineCode.shift().execute(this.varTable, this.execStack);
					if (this.stackMachineCode.length == 0) {
						this.markDead(stepProcessors.DeathReason.normal, this.execStack.pop());
					}
				} catch (err) {
					if(err.type == 'externalFunction'){
						var processor = new functionProcessors(this.rebuild,
							err.function, this.varTable, {});
						this.rebuild.addNewProcessor(processor);
					}
				}


				return Promise.resolve();

			default:
				return Promise.reject('notexpected');
		}

	}


}

export = ExpressionProcessor;