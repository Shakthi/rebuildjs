"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const superClass = require("./forIfElseStepProcessor");
const Ast = require("./ast.js");
const stepProcessors = require("./stepprocessor.js");
const assert = require("assert");
class forElseStepProcessor extends superClass.forIfElseStepProcessor {
    constructor(rebuild, statement, superVarTable, options) {
        super(rebuild, statement, superVarTable, options);
        this.forStatement = statement;
    }
    initializeI() {
        var beginvalue = this.forStatement.fromExpression.evaluate(this.varTable);
        this.varTable.setEntry(this.forStatement.varName, beginvalue);
    }
    getIValue() {
        return this.varTable.getEntry(this.forStatement.varName);
    }
    evaluateExitConditionI() {
        //var beginvalue = this.statement.toExpression.evaluate(this.varTable);
        var endvalue = this.forStatement.toExpression.evaluate(this.varTable);
        var forValue = this.getIValue();
        return (forValue <= endvalue);
    }
    incrementI() {
        this.varTable.setEntry(this.forStatement.varName, this.varTable.getEntry(this.forStatement.varName) + 1);
    }
    initialize() {
        this.initializeI();
        this.mode = this.evaluateExitConditionI() ? superClass.Mode.If : superClass.Mode.Else;
        super.initialize();
    }
    runStep(argument) {
        return __awaiter(this, void 0, void 0, function* () {
            var that = this;
            if (argument == stepProcessors.DeathReason.abort) {
                this.status = superClass.Status.Edit;
                this.lineHistory.historyIndex--;
                this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
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
                                this.incrementI();
                                this.lineHistory.historyIndex = 0;
                                if (!this.evaluateExitConditionI()) {
                                    this.status = superClass.Status.Dead;
                                    this.markDead();
                                }
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
                            prompt: this.setPrompt("for " + this.forStatement.varName + "}"),
                            macros: this.macros
                        });
                        this.processStep(answer);
                        return Promise.resolve();
                    }
                    else {
                        const answer = this.rebuild.getLine({
                            history: this.lineHistory,
                            prompt: this.setPrompt("forelse }"),
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
exports.forElseStepProcessor = forElseStepProcessor;
