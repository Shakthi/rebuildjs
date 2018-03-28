"use strict";
const Ast = require("./ast.js");
const stepProcessors = require("./stepprocessor.js");
const VarTable = require('./varTable.js');
var Status;
(function (Status) {
    Status[Status["Idle"] = 0] = "Idle";
    Status[Status["Converted"] = 1] = "Converted";
})(Status || (Status = {}));
;
class ExpressionProcessor extends stepProcessors.stepProcessor {
    constructor(rebuild, expression, superVarTable, options) {
        super(rebuild, null);
        this.expression = expression;
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
    generate3Address(expression) {
        var threeAddressList;
        threeAddressList = [];
        var tempCount = 0;
        //Recurisive post order traversal
        function geneAddress(expression) {
            if (expression instanceof Ast.terminalExpression) {
                tempCount++;
                console.log("t" + tempCount + " = " + expression.terminalValue);
                return tempCount;
            }
            else if (expression instanceof Ast.binaryExpression) {
                const t1 = geneAddress(expression.left);
                const t2 = geneAddress(expression.right);
                tempCount++;
                console.log("t" + tempCount + " = t" + t1 + expression.operator + "t" + t2);
                return tempCount;
            }
            else {
                return 0;
            }
        }
        geneAddress(expression);
        return threeAddressList;
    }
    runStep(argument) {
        switch (this.status) {
            case Status.Idle://We start converting to 3 address notation
                //this.generate3Address(this.expression);
                var counter = 0;
                var irlist = [];
                this.expression.to3AdressCode(counter, irlist);
                break;
            default:
                break;
        }
    }
}
module.exports = ExpressionProcessor;
