"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Ast = require("./ast.js");
const stepProcessors = require("./stepprocessor.js");
const superClass = require("./forIfElseStepProcessor");
const expressionProcessor = require("./ExpressionProcessor");
const assert = require("assert");
var InitStatus;
(function (InitStatus) {
    InitStatus[InitStatus["Idle"] = 0] = "Idle";
    InitStatus[InitStatus["Initializing"] = 1] = "Initializing";
    InitStatus[InitStatus["Running"] = 2] = "Running";
})(InitStatus || (InitStatus = {}));
;
class ifStepProcessor extends superClass.forIfElseStepProcessor {
    constructor(rebuild, statement, superVarTable, options) {
        super(rebuild, statement, superVarTable, options);
        this.initStatus = InitStatus.Idle;
        this.ifStatement = statement;
        this.originalVarTable = superVarTable; // This we  need to store becuase
        // conditional is excuted in outside the block context
    }
    evaluateCondition() {
        //var beginvalue = this.statement.toExpression.evaluate(this.varTable);
        return this.ifStatement.condition.evaluate(this.varTable);
    }
    initialize() {
    }
    postEvalinitialize(result) {
        //this.mode = this.evaluateCondition() ? superClass.Mode.If : superClass.Mode.Else;
        this.mode = result ? superClass.Mode.If : superClass.Mode.Else;
        super.initialize();
    }
    runStep(argument) {
        //TODO:All this states need to be moved to coroutine
        switch (this.initStatus) {
            case InitStatus.Idle:
                this.rebuild.addNewProcessor(new expressionProcessor(this.rebuild, this.ifStatement.condition, this.originalVarTable, {}));
                this.initStatus = InitStatus.Initializing;
                return Promise.resolve();
            case InitStatus.Initializing://We return here only after evaulation
                this.postEvalinitialize(argument.result);
                this.initStatus = InitStatus.Running;
                return Promise.resolve();
            case InitStatus.Running:
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
                return new Promise((resolve) => {
                    switch (this.status) {
                        case superClass.Status.Dead:
                            resolve();
                            break;
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
                                    resolve();
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
                                    resolve();
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
                                    resolve();
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
                                    resolve();
                                }
                            }
                            break;
                        case superClass.Status.Edit:
                            this.stepContext = {
                                addToHistory: true
                            };
                            if (this._isMature()) {
                                this.rebuild.getLine({
                                    history: this.lineHistory,
                                    prompt: this.setPrompt("if }"),
                                    macros: this.macros
                                }).then((answer) => {
                                    this.processStep(answer);
                                    resolve();
                                });
                            }
                            else {
                                this.rebuild.getLine({
                                    history: this.lineHistory,
                                    prompt: this.setPrompt("else }"),
                                    macros: this.macros
                                }).then((answer) => {
                                    this.processElseStatement(answer);
                                    resolve();
                                });
                            }
                            break;
                        default:
                            assert(false, "should not come here");
                    }
                });
            default:
                assert(false, "Should not come here");
                break;
        }
    }
    updateHistory(sentence) {
        if (this.stepContext.addToHistory) {
            this.addToHistory(sentence);
        }
        if (this.stepContext.needToRewindHistory) {
            this.lineHistory.rewind();
        }
    }
    addToHistory(sentence) {
        const writeContent = this.lineHistory.getContent()[this.lineHistory.getWriteHistoryIndex()];
        var replace = false;
        if (writeContent instanceof Ast.UnProcessedSentence) {
            replace = false;
        }
        else {
            replace = true;
        }
        this.rebuild.addHistoryEntry(sentence, {
            replace: replace,
            incrementer: (statement) => statement instanceof Ast.executableStatement ||
                statement instanceof Ast.UnProcessedSentence
        });
    }
}
exports.ifStepProcessor = ifStepProcessor;
