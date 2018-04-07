"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const superClass = require("./forIfElseStepProcessor");
const Ast = require("./ast.js");
const stepProcessors = require("./stepprocessor.js");
const assert = require("assert");
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
    // getIValue() {
    // 	return this.varTable.getEntry(this.functionStatement.varName);
    // }
    validateParamater() {
        return true; //For now allwyas validate 
    }
    initialize() {
        this.loadFunctionDefinition(this.varTable.getEntry(this.functionStatement.name));
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
                .varTable.setEntry(this.functionStatement.name,this.functionStatement.clone());
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
    runStep(argument) {
        return __awaiter(this, void 0, void 0, function* () {
            var that = this;
            if (argument == stepProcessors.DeathReason.abort) {
                this.status = superClass.Status.Edit;
                this.lineHistory.historyIndex--;
                this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
            }
            if (argument.deathNote == stepProcessors.DeathReason.returned) {
                this.status = superClass.Status.Dead;
                this.markDead(stepProcessors.DeathReason.returned, argument.result);
            }
            function runner(statement) {
                if (statement instanceof Ast.DebuggerTrap) {
                    const debuggerTrapStatment = statement;
                    that.rebuild.console.log("!!Trapped - " + debuggerTrapStatment.message);
                    return {
                        debuggerTrap: true
                    };
                }
                if (statement instanceof Ast.executableStatement) {
                    that.processStatement(statement);
                }
            }
            switch (this.status) {
                case superClass.Status.Dead:
                    return Promise.resolve();
                case superClass.Status.Run:
                    if (this._isMature()) {
                        if (this.lineHistory.historyIndex >= this.lineHistory.writeHistoryIndex) {
                            if (this.lineHistory.historyIndex == 0) {
                                that.rebuild.console.log("!!Edit please ");
                                this.status = superClass.Status.Edit;
                                this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
                            }
                            else {
                                this.status = superClass.Status.Dead;
                                this.markDead();
                            }
                            return Promise.resolve();
                        }
                        else {
                            const ret = runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
                            if (ret && ret.debuggerTrap) {
                                this.status = superClass.Status.Edit;
                                this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
                            }
                            else {
                                this.lineHistory.historyIndex++;
                            }
                            return Promise.resolve();
                        }
                    }
                    else {
                        ///This where we are entering when else part of the for subjuect to tun 
                        if (this.lineHistory.historyIndex >= this.lineHistory.writeHistoryIndex) {
                            if (this.lineHistory.historyIndex == 0) {
                                that.rebuild.console.log("!!Edit please ");
                                this.status = superClass.Status.Edit;
                                this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
                            }
                            else {
                                this.status = superClass.Status.Dead;
                                this.markDead();
                            }
                            return Promise.resolve();
                        }
                        else {
                            const ret = runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
                            if (ret && ret.debuggerTrap) {
                                this.status = superClass.Status.Edit;
                                this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
                            }
                            else {
                                this.lineHistory.historyIndex++;
                            }
                            return Promise.resolve();
                        }
                    }
                case superClass.Status.Edit:
                    this.stepContext = {
                        addToHistory: true
                    };
                    if (this._isMature()) {
                        const answer = yield this.rebuild.getLine({
                            history: this.lineHistory,
                            prompt: this.setPrompt("function " + this.functionStatement.name + "()"),
                            macros: this.macros
                        });
                        this.processStep(answer);
                        return Promise.resolve();
                    }
                    else {
                        const answer = this.rebuild.getLine({
                            history: this.lineHistory,
                            prompt: this.setPrompt("functionThrown "),
                            macros: this.macros
                        });
                        this.processElseStatement(answer);
                        return Promise.resolve();
                    }
                default:
                    assert(false, "should not come here");
            }
        });
    }
}
module.exports = FunctionProcessor;
