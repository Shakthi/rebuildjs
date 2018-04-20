"use strict";
const FunctionProcessor = require("./FunctionProcessor");
const Ast = require("./ast.js");
const forIfElseStepProcessor = require("./forIfElseStepProcessor");
const varTable = require('./varTable.js');
class MainFunctionProcessor extends FunctionProcessor {
    constructor(rebuild, history, options) {
        super(rebuild, new Ast.functionExpression("main", []), new varTable(), [], options);
    }
    archiveStatement() {
    }
    unarchiveStatement(val) {
    }
    runStep(argument) {
        return this.runGenerater(argument);
    }
    *runStepPositiveAsync_EditState() {
        do {
            this.stepContext.addToHistory = true;
            const answer = yield this.rebuild.getLine({
                history: this.lineHistory,
                prompt: this.setPrompt("main}"),
                macros: this.macros
            });
            yield* this.processStepAsync(answer);
            yield;
        } while (this.status == forIfElseStepProcessor.Status.Edit);
    }
    *processStatementAsync(statement, options) {
        if (statement instanceof Ast.endStatement) {
            this.rebuild.console.log("Bye Bye");
            this.returnStep(0);
        }
        else {
            yield* super.processStatementAsync(statement, options);
        }
    }
}
module.exports = MainFunctionProcessor;
