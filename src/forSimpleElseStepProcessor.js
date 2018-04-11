"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const superClass = require("./forIfElseStepProcessor");
class forElseStepProcessor extends superClass.forIfElseStepProcessor {
    constructor(rebuild, statement, superVarTable, options) {
        super(rebuild, statement, superVarTable, options);
        this.forStatement = statement;
        this.originalVarTable = superVarTable;
    }
    *initializeI() {
        let beginvalue = yield* this.evaluateExpressionAsync(this.forStatement.fromExpression);
        this.varTable.setEntry(this.forStatement.varName, beginvalue);
    }
    getIValue() {
        return this.varTable.getEntry(this.forStatement.varName);
    }
    *evaluateExitConditionI() {
        let endvalue = yield* this.evaluateExpressionAsync(this.forStatement.toExpression);
        var forValue = this.getIValue();
        return (forValue <= endvalue);
    }
    incrementI() {
        this.varTable.setEntry(this.forStatement.varName, this.varTable.getEntry(this.forStatement.varName) + 1);
    }
    //override intialization
    initialize() {
    }
    runStep(argument) {
        return this.runGenerater(argument);
    }
    *runStepPositiveAsync_EditState() {
        do {
            this.stepContext.addToHistory = true;
            const answer = yield this.rebuild.getLine({
                history: this.lineHistory,
                prompt: this.setPrompt("for " + this.forStatement.varName + "}"),
                macros: this.macros
            });
            yield* this.processStepAsync(answer);
            yield;
        } while (this.status == superClass.Status.Edit);
    }
    *runStepNegetiveAsync_EditState() {
        do {
            this.stepContext.addToHistory = true;
            const answer = yield this.rebuild.getLine({
                history: this.lineHistory,
                prompt: this.setPrompt("forelse }"),
                macros: this.macros
            });
            yield* this.processStepAsync(answer);
        } while (this.status == superClass.Status.Edit);
    }
    *runStepPositiveAsync_RunState() {
        do {
            while (this.lineHistory.historyIndex < this.lineHistory.writeHistoryIndex) {
                const ret = yield* this.runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
                if (ret && ret.debuggerTrap) {
                    this.status = superClass.Status.Edit;
                    this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
                    return;
                }
                else {
                    this.lineHistory.historyIndex++;
                }
                yield;
            }
            if (this.lineHistory.historyIndex == 0) {
                this.rebuild.console.log("!!Edit please ");
                this.status = superClass.Status.Edit;
                this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
                return;
            }
            this.incrementI();
            this.lineHistory.historyIndex = 0;
        } while ((yield* this.evaluateExitConditionI()));
    }
    *runStepPositiveAsync() {
        if (this.status == superClass.Status.Run) {
            yield* this.runStepPositiveAsync_RunState();
        }
        if (this.status == superClass.Status.Edit) {
            yield* this.runStepPositiveAsync_EditState();
            yield* this.runStepPositiveAsync_RunState(); //End run
        }
    }
    *runStepAsync() {
        yield* this.initializeI();
        this.mode = (yield* this.evaluateExitConditionI()) ? superClass.Mode.If : superClass.Mode.Else;
        super.initialize();
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
exports.forElseStepProcessor = forElseStepProcessor;
