import basicStepprocessor = require('./basicStepprocessor.js');
import superClass = require('./forIfElseStepProcessor');


import Ast = require('./ast.js');
import stepProcessors = require('./stepprocessor.js');
import StackedSentenceHistory = require('./StackedSentenceHistory.js');
import assert = require('assert');
import './utils.js';






class FunctionProcessor extends superClass.forIfElseStepProcessor {

    functionStatement: Ast.functionExpression;



    constructor(rebuild: any, statement: Ast.functionExpression,
        superVarTable: any,
        private argumentList: any[],
        options: any) {
        super(rebuild, statement, superVarTable, options);
        this.functionStatement = statement;

    }


    initializeFormalParameter() {

        this.argumentList.forEach((element, index) => {
            this.varTable.setEntry("argument" + index, element);
        });
        this.varTable.setEntry("argumentLength", this.argumentList.length);

    }



    validateParamater(): boolean {

        return true; //For now allwyas validate 
    }

    

    initialize(): void {

        this.varTable.getEntry(this.functionStatement.name);
        this.initializeFormalParameter();
        this.mode = this.validateParamater() ? superClass.Mode.If : superClass.Mode.Else;
        super.initialize();

    }


    loadFunctionDefinition(ref: any) {
        const referenceFun = (ref as Ast.functionExpression);
        if (referenceFun) {
            this.functionStatement.subStatements = referenceFun.subStatements;
            this.functionStatement.negetiveSubStatements = referenceFun.negetiveSubStatements;

        }

    }

    saveFunctionDefinition():void
    {
        var savedEntry = this.varTable.getEntry(this.functionStatement.name);
        if(!savedEntry){
            this.rebuild.functionProcessorList.top()
                .varTable.setEntry(this.functionStatement.name);
             savedEntry = this.varTable.getEntry(this.functionStatement.name);
        }
        
        savedEntry.subStatements = this.functionStatement.subStatements;
        savedEntry.negetiveSubStatements = this.functionStatement.negetiveSubStatements;

        this.functionStatement.subStatements =[];
        this.functionStatement.negetiveSubStatements =[];

    }

    archiveStatement(): void {
        super.archiveStatement();
        this.saveFunctionDefinition();

    }    

    unarchiveStatement(val:boolean): void {
        const savedEntry = this.varTable.getEntry(this.functionStatement.name);
        if (savedEntry) {
            this.loadFunctionDefinition(savedEntry);
        }
        super.unarchiveStatement(val);

    }   


	* runStepAsync():IterableIterator<void> {

		this.stepContext = {};
		if (this.mode === superClass.Mode.If) {

			yield* this.runStepPositiveAsync();

		} else {

			yield* this.runStepNegetiveAsync();


		}
        this.markDead();

	}


    /*

    async runStep(argument: any): Promise<void> {

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
                        prompt: this.setPrompt("function " + this.functionStatement.name + "()"),
                        macros: this.macros
                    });

                    this.processStep(answer);
                    return Promise.resolve();


                } else {

                    const answer: basicStepprocessor.answer = this.rebuild.getLine({
                        history: this.lineHistory,
                        prompt: this.setPrompt("functionThrown "),
                        macros: this.macros
                    })

                    this.processElseStatement(answer);
                    return Promise.resolve();
                }

            default:
                assert(false, "should not come here");
        }




    }*/





}




export = FunctionProcessor;