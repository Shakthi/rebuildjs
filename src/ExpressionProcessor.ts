import Ast = require('./ast.js');
import stepProcessors = require('./stepprocessor.js');

const VarTable = require('./varTable.js');


import assert = require('assert');
enum Status{Idle,Converted};

class ExpressionProcessor extends stepProcessors.stepProcessor {
	varTable: any;
	status:Status;
	
	constructor(rebuild: any,private expression: Ast.expression,
		superVarTable: any,
		options: any) {
		super(rebuild, null);
		this.varTable = new VarTable();
		if (superVarTable) {
			this.varTable.superEntry = superVarTable;
		}
		this.status = Status.Idle;
	}	

	//a+b*(c+d)
    //t1 = c + d
	//t2 = b * t1
	//result = a + t2

	//+a*b+cd



	// evaluate() {
	// 	//var beginvalue = this.statement.toExpression.evaluate(this.varTable);
	// 	return this.expression.evaluate(this.varTable);
	// }



	generate3Address(expression:Ast.expression)
	{	
		var threeAddressList:  any []
		threeAddressList = [];
		var tempCount = 0;
		//Recurisive post order traversal
		function geneAddress(expression:Ast.expression):number{

			if( expression instanceof Ast.terminalExpression){
				tempCount++;
				console.log("t"+tempCount+" = "+(expression as Ast.terminalExpression).terminalValue)
				return tempCount;

			} else if(expression instanceof Ast.binaryExpression){
				const t1 =  geneAddress((expression as Ast.binaryExpression).left);
				const t2 = geneAddress((expression as Ast.binaryExpression).right);
				tempCount++;
                console.log("t" + tempCount + " = t" + t1 + expression.operator + "t"+t2);
				return tempCount;

            }else{

				return 0;
			}
		}

		geneAddress(expression);

		return threeAddressList;

	}


	runStep(argument: any) {

		switch (this.status) {
			case Status.Idle://We start converting to 3 address notation
			//this.generate3Address(this.expression);
			var counter = 0; var irlist : any[] =[]; 
			this.expression.to3AdressCode(counter,irlist);

				break;
		
			default:
				break;
		}

	}


}

export = ExpressionProcessor;