"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Ast = require("./ast.js");
const superClass = require("./forIfElseStepProcessor");
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
        this.markDead();
    }
    runStep(argument) {
        return this.runGenerater(argument);
    }
    /*
    async runStep(argument: any): Promise<void> {
        //TODO:All this states need to be moved to coroutine

        if (argument == stepProcessors.DeathReason.returned) {
            this.status = superClass.Status.Edit;
            this.lineHistory.historyIndex--;
            this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
        }


        switch (this.initStatus) {
            case InitStatus.Idle:
                this.rebuild.addNewProcessor(new expressionProcessor(this.rebuild, this.ifStatement.condition,
                    this.originalVarTable, {}));
                this.initStatus = InitStatus.Initializing;

                return Promise.resolve();

            case InitStatus.Initializing: //We return here only after evaulation
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

                function runner(statement: Ast.Statement) {

                    if (statement instanceof Ast.DebuggerTrap) {
                        const debuggerTrapStatment = statement as Ast.DebuggerTrap;
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
                            } else {

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
                        } else {

                            ///This where we are entering when else part of the for subjuect to tun
                            if (this.lineHistory.historyIndex >= this.lineHistory.writeHistoryIndex) { //End of loop
                                if (this.lineHistory.historyIndex == 0) { //Empty else part
                                    that.rebuild.console.log("!!Edit please ");
                                    this.status = superClass.Status.Edit;
                                    this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
                                }
                                else {
                                    this.status = superClass.Status.Dead;
                                    this.markDead();

                                }
                                return Promise.resolve();
                            } else {

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

                            const answer: basicStepprocessor.answer = await this.rebuild.getLine({
                                history: this.lineHistory,
                                prompt: this.setPrompt("if }"),
                                macros: this.macros
                            });

                            this.processStep(answer);
                            return Promise.resolve();


                        } else {

                            const answer: basicStepprocessor.answer = await this.rebuild.getLine({
                                history: this.lineHistory,
                                prompt: this.setPrompt("else }"),
                                macros: this.macros

                            });

                            this.processElseStatement(answer);
                            return Promise.resolve();


                        }


                    default:
                        assert(false, "should not come here");


                }



            default:
            return Promise.reject( "Should not come here");
        }


    }
*/
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
}
exports.ifStepProcessor = ifStepProcessor;
