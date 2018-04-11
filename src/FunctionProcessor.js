"use strict";
const superClass = require("./forIfElseStepProcessor");
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
                .varTable.setEntry(this.functionStatement.name);
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
        this.markDead();
    }
}
module.exports = FunctionProcessor;
