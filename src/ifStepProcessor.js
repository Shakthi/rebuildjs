"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const basicStepprocessor = require("./basicStepprocessor.js");
const Ast = require("./ast.js");
const stepProcessors = require("./stepprocessor.js");
const StackedSentenceHistory = require("./StackedSentenceHistory.js");
var Status;
(function (Status) {
    Status[Status["Idle"] = 0] = "Idle";
    Status[Status["Edit"] = 1] = "Edit";
    Status[Status["Run"] = 2] = "Run";
    Status[Status["LastRun"] = 3] = "LastRun";
    Status[Status["Dead"] = 4] = "Dead";
    Status[Status["Quit"] = 5] = "Quit";
})(Status || (Status = {}));
;
const assert = require("assert");
var Mode;
(function (Mode) {
    Mode[Mode["If"] = 0] = "If";
    Mode[Mode["Else"] = 1] = "Else";
    Mode[Mode["Undecided"] = 2] = "Undecided";
})(Mode || (Mode = {}));
;
class ifStepProcessor extends basicStepprocessor.BasicStepProcessor {
    constructor(rebuild, statement, superVarTable, options) {
        super(rebuild, new StackedSentenceHistory(rebuild.getHistoryStack()), superVarTable);
        this.statement = statement;
        this.options = options;
        this.macros += "u";
        this.mode = Mode.Undecided;
        this.status = Status.Edit;
        if (!this.options) {
            this.options = {};
        }
    }
    onEnter() {
        super.onEnter();
        this.lineHistory.init();
        this.initialize();
    }
    onExit() {
        if (this.status != Status.Quit)
            this.archiveStatement();
        super.onExit();
    }
    _isForced() {
        return this.options.debug === 'stepin';
    }
    evaluateCondition() {
        //var beginvalue = this.statement.toExpression.evaluate(this.varTable);
        return this.statement.condition.evaluate(this.varTable);
    }
    initialize() {
        this.mode = this.evaluateCondition() ? Mode.If : Mode.Else;
        this.unarchiveStatement(this.mode == Mode.If); //Evaluate
        if (!this._isForced()) {
            this.status = Status.LastRun;
        }
        else {
            this.lineHistory.rewind();
            this.status = Status.Edit;
        }
        this.lineHistory.historyIndex = 0;
    }
    archiveStatement() {
        this.statement.subStatements = [];
        this.lineHistory.getContent().forEach((statement) => {
            if (statement instanceof Ast.executableStatement) {
                this.statement.subStatements.push(statement);
            }
        });
    }
    unarchiveStatement(isTrue) {
        if (isTrue) {
            if (this.statement.subStatements.length) {
                this.statement.subStatements.forEach((argument) => {
                    this.lineHistory._internalAdd(argument);
                });
            }
            else {
                this.statement.subStatements.forEach((argument) => {
                    this.lineHistory._internalAdd(argument);
                });
            }
        }
        else {
            this.statement.negetiveSubStatements.forEach((argument) => {
                this.lineHistory._internalAdd(argument);
            });
        }
    }
    _isMature() {
        return this.mode == Mode.If;
    }
    processElseStatement(answer) {
        this.processStep(answer);
    }
    runStep(argument) {
        var that = this;
        if (argument == stepProcessors.DeathReason.abort) {
            this.status = Status.Edit;
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
            if (statement instanceof Ast.UnProcessedSentence) {
                that.rebuild.console.log("!!Edit please ");
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
                case Status.Dead:
                    resolve();
                    break;
                case Status.Run:
                case Status.LastRun:
                    const ret = runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
                    if (ret && ret.debuggerTrap) {
                        this.status = Status.Edit;
                        this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
                    }
                    else {
                        this.lineHistory.historyIndex++;
                        if (this.lineHistory.historyIndex == this.lineHistory.writeHistoryIndex + 1) {
                            this.lineHistory.historyIndex--;
                            if (this.status == Status.LastRun) {
                                this.status = Status.Dead;
                                this.markDead();
                            }
                            else {
                                this.lineHistory.rewind();
                                this.status = Status.Edit;
                            }
                        }
                    }
                    resolve();
                    break;
                case Status.Edit:
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
