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

    saveFunctionDefinition(): void {
        var savedEntry = this.varTable.getEntry(this.functionStatement.name);
        if (!savedEntry) {
            this.rebuild.functionProcessorList.top()
                .varTable.setEntry(this.functionStatement.name, this.functionStatement);
            savedEntry = this.varTable.getEntry(this.functionStatement.name);
        }

        savedEntry.subStatements = this.functionStatement.subStatements;
        savedEntry.negetiveSubStatements = this.functionStatement.negetiveSubStatements;

        this.functionStatement.subStatements = [];
        this.functionStatement.negetiveSubStatements = [];

    }

    archiveStatement(): void {
        super.archiveStatement();
        this.saveFunctionDefinition();

    }

    unarchiveStatement(val: boolean): void {
        const savedEntry = this.varTable.getEntry(this.functionStatement.name);
        if (savedEntry) {
            this.loadFunctionDefinition(savedEntry);
        }
        super.unarchiveStatement(val);

    }


    * runStepAsync(): IterableIterator<void> {

        this.stepContext = {};
        if (this.mode === superClass.Mode.If) {

            yield* this.runStepPositiveAsync();

        } else {

            yield* this.runStepNegetiveAsync();


        }
        return this.getReturnStepValue();

    }


    runStep(argument: any) {
        return this.runGenerater(argument);
    }

    *runStepPositiveAsync_EditState(): IterableIterator<any> {

        do {
            this.stepContext.addToHistory = true;

            const answer: basicStepprocessor.answer = yield this.rebuild.getLine({
                history: this.lineHistory,
                prompt: this.setPrompt(this.functionStatement.name + "}"),
                macros: this.macros
            });

            yield* this.processStepAsync(answer);

            yield;
        } while (this.status == superClass.Status.Edit);

    }

    *callProcessorAsync(processor: basicStepprocessor.BasicStepProcessor): any {


        var result = yield* super.callProcessorAsync(processor);

        if (processor instanceof FunctionProcessor) { //Return from another function

            switch (result.type) {
                case 'returnStatement':
                    return result.value;
                case 'thrown':
                    break;
                default:
                    break;
            }

        } else { //Return Back from loop

            switch (result.type) {
                case 'returnStatement':
                    this.returnStep(result.value);
                    break;

                default:
                    break;
            }


        }



    }


    *processStatementAsync(statement: Ast.Statement,options:any): IterableIterator<any>{

        if (statement instanceof Ast.endStatement) {

            this.stepContext.addToHistory = false;
             yield * super.processStatementAsync(new Ast.errorStatement("Function should end with return statement",statement.toCode(),"return value"),options);

    
        } else{
            yield * super.processStatementAsync(statement,options);
        }

    }





}







export = FunctionProcessor;