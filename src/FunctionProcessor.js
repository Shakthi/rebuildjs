"use strict";
const superClass = require("./forIfElseStepProcessor");
const Ast = require("./ast.js");
require("./utils.js");
class FunctionProcessor extends superClass.forIfElseStepProcessor {
    constructor(rebuild, statement, superVarTable, argumentList, options) {
        super(rebuild, statement, superVarTable, options);
        this.argumentList = argumentList;
        this.functionStatement = statement;
    }
    initializeFormalParameter() {
        this.argumentList.forEach((element, index) => {
            this.varTable.setEntry("argument" + index, element);
        });
        this.varTable.setEntry("argumentLength", this.argumentList.length);
    }
    validateParamater() {
        return true; //For now allwyas validate 
    }
    initialize() {
        this.varTable.getEntry(this.functionStatement.name);
        this.initializeFormalParameter();
        this.mode = this.validateParamater() ? superClass.Mode.If : superClass.Mode.Else;
        super.initialize();
    }
    loadFunctionDefinition(ref) {
        const referenceFun = ref;
        if (referenceFun) {
            this.functionStatement.subStatements = referenceFun.subStatements;
            this.functionStatement.negetiveSubStatements = referenceFun.negetiveSubStatements;
        }
    }
    saveFunctionDefinition() {
        var savedEntry = this.varTable.getEntry(this.functionStatement.name);
        if (!savedEntry) {
            this.rebuild.functionProcessorList.top()
                .varTable.setEntry(this.functionStatement.name, this.functionStatement);
            savedEntry = this.varTable.getEntry(this.functionStatement.name);
        }
        savedEntry.subStatements = this.functionStatement.subStatements;
        savedEntry.negetiveSubStatements = this.functionStatement.negetiveSubStatements;
        this.functionStatement.subStatements = [];
        this.functionStatement.negetiveSubStatements = [];
    }
    archiveStatement() {
        super.archiveStatement();
        this.saveFunctionDefinition();
    }
    unarchiveStatement(val) {
        const savedEntry = this.varTable.getEntry(this.functionStatement.name);
        if (savedEntry) {
            this.loadFunctionDefinition(savedEntry);
        }
        super.unarchiveStatement(val);
    }
    *runStepAsync() {
        this.stepContext = {};
        if (this.mode === superClass.Mode.If) {
            yield* this.runStepPositiveAsync();
        }
        else {
            yield* this.runStepNegetiveAsync();
        }
        return this.getReturnStepValue();
    }
    runStep(argument) {
        return this.runGenerater(argument);
    }
    *runStepPositiveAsync_EditState() {
        do {
            this.stepContext.addToHistory = true;
            const answer = yield this.rebuild.getLine({
                history: this.lineHistory,
                prompt: this.setPrompt(this.functionStatement.name + "}"),
                macros: this.macros
            });
            yield* this.processStepAsync(answer);
            yield;
        } while (this.status == superClass.Status.Edit);
    }
    *callProcessorAsync(processor) {
        var result = yield* super.callProcessorAsync(processor);
        if (processor instanceof FunctionProcessor) {
            switch (result.type) {
                case 'returnStatement':
                    return result.value;
                case 'thrown':
                    break;
                default:
                    break;
            }
        }
        else {
            switch (result.type) {
                case 'returnStatement':
                    this.returnStep(result.value);
                    break;
                default:
                    break;
            }
        }
    }
    *processStatementAsync(statement, options) {
        if (statement instanceof Ast.endStatement) {
            this.stepContext.addToHistory = false;
            yield* super.processStatementAsync(new Ast.errorStatement("Function should end with return statement", statement.toCode(), "return value"), options);
        }
        else {
            yield* super.processStatementAsync(statement, options);
        }
    }
}
module.exports = FunctionProcessor;
