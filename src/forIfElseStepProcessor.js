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
    Status[Status["Dead"] = 3] = "Dead";
    Status[Status["Quit"] = 4] = "Quit";
})(Status = exports.Status || (exports.Status = {}));
;
var Mode;
(function (Mode) {
    Mode[Mode["If"] = 0] = "If";
    Mode[Mode["Else"] = 1] = "Else";
    Mode[Mode["Undecided"] = 2] = "Undecided";
})(Mode = exports.Mode || (exports.Mode = {}));
;
class forIfElseStepProcessor extends basicStepprocessor.BasicStepProcessor {
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
    processEndStatement() {
        this.status = Status.Run;
        this.stepContext.addToHistory = false;
    }
    initialize() {
        this.unarchiveStatement(this.mode == Mode.If); //Evaluate
        if (!this._isForced()) {
            this.status = Status.Run;
        }
        else {
            this.lineHistory.rewind();
            this.status = Status.Edit;
        }
        this.lineHistory.historyIndex = 0;
    }
    archiveStatement() {
        if (this.mode == Mode.If) {
            this.statement.subStatements = [];
        }
        else {
            this.statement.negetiveSubStatements = [];
        }
        this.lineHistory.getContent().forEach((statement) => {
            if (statement instanceof Ast.executableStatement) {
                if (this.mode == Mode.If) {
                    this.statement.subStatements.push(statement);
                }
                else {
                    this.statement.negetiveSubStatements.push(statement);
                }
            }
        });
    }
    unarchiveStatement(isTrue) {
        if (isTrue) {
            this.statement.subStatements.forEach((argument) => {
                this.lineHistory._internalAdd(argument);
            });
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
    processByMacros(answer) {
        if (!answer.key)
            return answer;
        var answer2 = answer;
        switch (answer.key.name) {
            case 'u':
                answer2.line = '.checkback';
                this.stepContext.traceParsed = false;
                break;
            default:
                answer2 = super.processByMacros(answer2);
        }
        return answer2;
    }
    processCommand(command) {
        if (command instanceof Ast.CustomCommand) {
            switch (command.name) {
                case 'rewind':
                    this.stepContext.needToRewindHistory = true;
                    break;
                case 'quit':
                    this.status = Status.Quit;
                    this.markDead(stepProcessors.DeathReason.abort);
                    break;
                case 'checkback':
                    for (var i = this.lineHistory.getContent().length - 1; i >= 0; i--) {
                        if (this.lineHistory.getContent()[i] instanceof Ast.executableStatement) {
                            break;
                        }
                        else {
                            this.lineHistory.popBack();
                        }
                    }
                    this.stepContext.addToHistory = false;
                    break;
                default:
                    super.processCommand(command);
            }
        }
        else {
            //throw ("Failed to process sentence" + JSON.stringify(command.toJson()));
        }
    }
}
exports.forIfElseStepProcessor = forIfElseStepProcessor;
