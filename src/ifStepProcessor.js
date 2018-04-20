"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const superClass = require("./forIfElseStepProcessor");
const Status = superClass.Status;
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
        this.setPrompt("if }");
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
    *runStepAsync() {
        this.postEvalinitialize(yield* this.evaluateExpressionAsync(this.ifStatement.condition, this.originalVarTable));
        this.stepContext = {};
        if (this.mode === superClass.Mode.If) {
            yield* this.runStepPositiveAsync();
        }
        else {
            yield* this.runStepNegetiveAsync();
        }
        if (this.status != Status.Dead) {
            this.processEndStatement();
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
                prompt: this.setPrompt("if }"),
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
                prompt: this.setPrompt("else }"),
                macros: this.macros
            });
            yield* this.processStepAsync(answer);
        } while (this.status == superClass.Status.Edit);
    }
    *callProcessorAsync(processor) {
        var result = yield* super.callProcessorAsync(processor);
        switch (result.type) {
            case 'returnStatement':
                this.returnStep(result.value);
                break;
            default:
                break;
        }
    }
    processEndStatement() {
        this.status = Status.Dead;
        this.stepContext.addToHistory = false;
        super.processEndStatement();
    }
}
exports.ifStepProcessor = ifStepProcessor;
