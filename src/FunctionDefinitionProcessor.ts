import basicStepprocessor = require('./basicStepprocessor.js');
import superClass = require('./forIfElseStepProcessor');


import Ast = require('./ast.js');
import stepProcessors = require('./stepprocessor.js');
import StackedSentenceHistory = require('./StackedSentenceHistory.js');
import assert = require('assert');
import './utils.js';






class FunctionProcessor extends superClass.forIfElseStepProcessor {

    functionStatement: Ast.functionDefine;



    constructor(rebuild: any, statement: Ast.functionDefine,
        superVarTable: any,
        options: any) {
        super(rebuild, statement, superVarTable, options);
        this.functionStatement = statement;

    }


    *initializeFormalParameterAsync(): IterableIterator<any> {
        if (this.options.reloaded) {

            this.functionStatement.argumentList.forEach((element, index) => {
                this.varTable.setEntry(element.id, this.options.paramater[index]);
            });
        } else if (this.options.redefined) {
            for (let index = 0; index < this.options.paramater.length; index++) {
                const element = this.options.paramater[index];
                let val = yield* this.evaluateExpressionAsync(element.value);
                this.varTable.setEntry(element.id, val);
            }
        }
        else if(this.options.onFlyCreate){
            for (let index = 0; index < this.functionStatement.argumentList.length; index++) {
                const element = this.functionStatement.argumentList[index];
                let val = element.value;
                this.varTable.setEntry(element.id, val);
            }
        }
        else {
            for (let index = 0; index < this.functionStatement.argumentList.length; index++) {
                const element = this.functionStatement.argumentList[index];
                let val = yield* this.evaluateExpressionAsync(element.value);
                this.varTable.setEntry(element.id, val);
            }
        }

        this.varTable.setEntry("argumentLength", this.functionStatement.argumentList.length);

    }

    // print max(45,22)
    //defun max(a:1,b:2)

    validateParamater(): boolean {

        return true; //For now allwyas validate 
    }



    initialize(): void {



    }



    * runStepAsync(): IterableIterator<void> {

        yield* this.initializeFormalParameterAsync();
        this.mode = this.validateParamater() ? superClass.Mode.If : superClass.Mode.Else;
        super.initialize();
        if (this.options.redefined) {

            this.lineHistory.rewind();
            this.status = superClass.Status.Edit;
        }

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

    * runStepPositiveAsync_EditState(): IterableIterator<any> {

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

    * callProcessorAsync(processor: basicStepprocessor.BasicStepProcessor): any {


        var result = yield* super.callProcessorAsync(processor);

        if (processor.constructor.name == "FunctionProcessor" ||
            processor.constructor.name == "FunctionDefineProcessor") { //Return from another function

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


    * processStatementAsync(statement: Ast.Statement, options: any): IterableIterator<any> {

        if (statement instanceof Ast.endStatement) {

            this.stepContext.addToHistory = false;
            yield* super.processStatementAsync(new Ast.errorStatement("Function should end with return statement", statement.toCode(), "return value"), options);


        } else {
            yield* super.processStatementAsync(statement, options);
        }

    }





}







export = FunctionProcessor;