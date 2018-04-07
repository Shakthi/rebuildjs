"use strict";
const stepProcessors = require("./stepprocessor.js");
const functionProcessors = require("./FunctionProcessor");
const VarTable = require('./varTable.js');
var Status;
(function (Status) {
    Status[Status["Idle"] = 0] = "Idle";
    Status[Status["Execute"] = 1] = "Execute";
})(Status || (Status = {}));
;
class ExpressionProcessor extends stepProcessors.stepProcessor {
    constructor(rebuild, expression, superVarTable, options) {
        super(rebuild, null);
        this.expression = expression;
        this.varTable = new VarTable();
        this.stackMachineCode = [];
        this.execStack = [];
        if (superVarTable) {
            this.varTable.superEntry = superVarTable;
        }
        this.status = Status.Idle;
    }
    onEnter() {
        super.onEnter();
        this.rebuild.setPrompt("");
    }
    runStep(argument) {
        if (argument.deathNote == stepProcessors.DeathReason.returned) {
            this.execStack.push(argument.result);
        }
        switch (this.status) {
            case Status.Idle://We start converting to 3 address notation
                ////this.generate3Address(this.expression);
                var a = [];
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
                }
                catch (err) {
                    if (err.type == 'externalFunction') {
                        var processor = new functionProcessors(this.rebuild, err.function, this.varTable, err.argumentList, {});
                        this.rebuild.addNewProcessor(processor);
                    }
                }
                return Promise.resolve();
            default:
                return Promise.reject('notexpected');
        }
    }
}
module.exports = ExpressionProcessor;
