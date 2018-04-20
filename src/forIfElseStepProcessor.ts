import basicStepprocessor = require('./basicStepprocessor.js');
import Ast = require('./ast.js');
import stepProcessors = require('./stepprocessor.js');
import StackedSentenceHistory = require('./StackedSentenceHistory.js');
export enum Status {
	Idle, Edit, Run, Dead, Quit
};




import assert = require('assert');


export enum Mode { If, Else, Undecided };

export class forIfElseStepProcessor extends basicStepprocessor.BasicStepProcessor {
	mode: Mode;
	status: Status;
	stepIterater: Iterator<void> | Iterator<Promise<void>>;


	constructor(rebuild: any, protected statement: Ast.ifStatementForIfElseStatement,
		superVarTable: any,
		private options: any) {


		super(rebuild, new StackedSentenceHistory(rebuild.getHistoryStack()), superVarTable);

		this.macros += "u";
		this.mode = Mode.Undecided;
		this.status = Status.Edit;

		if (!this.options) {
			this.options = {};
		}
		this.stepIterater = this.runStepAsync();


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

	*runStepAsync(): IterableIterator<void> {

	}


	processEndStatement() {
		this.status = Status.Run;
		this.stepContext.addToHistory = false;
	}


	initialize() {

		this.unarchiveStatement(this.mode == Mode.If);//Evaluate
		if (!this._isForced()) {
			this.status = Status.Run;
		} else {
			this.lineHistory.rewind();
			this.status = Status.Edit;
		}


		this.lineHistory.historyIndex = 0;
	}

	archiveStatement(): void {

		if (this.mode == Mode.If) {
			this.statement.subStatements = [];

		} else {
			this.statement.negetiveSubStatements = [];
		}
		this.lineHistory.getContent().forEach((statement: Ast.Sentence) => {

			if (statement instanceof Ast.executableStatement) {
				if (this.mode == Mode.If) {
					this.statement.subStatements.push(statement);

				} else {
					this.statement.negetiveSubStatements.push(statement);
				}
			}

		});
	}

	unarchiveStatement(isTrue: boolean) {
		if (isTrue) {

			this.statement.subStatements.forEach((argument: Ast.Sentence) => {
				this.lineHistory._internalAdd(argument);
			});


		} else {
			this.statement.negetiveSubStatements.forEach((argument: Ast.Sentence) => {
				this.lineHistory._internalAdd(argument);
			});

		}


	}

	_isMature() {

		return this.mode == Mode.If;
	}

	processElseStatement(answer: basicStepprocessor.answer) {
		this.processStep(answer);
	}

	returnStep (result:any) {	
		this.status = Status.Dead;
		super.returnStep(result);
    };

    
	


	runGenerater(argument: any): Promise<any> {
		return new Promise<any>((resolve, reject) => {

			let result = this.stepIterater.next(argument);
            if (result.value instanceof Promise) {
                result.value.then((promiseResult) => resolve(promiseResult))
            } else {
                resolve(result);

            }

		});

	}




	updateHistory(sentence: Ast.Sentence) {

		if (this.stepContext.addToHistory) {
			this.addToHistory(sentence);
		}

		if (this.stepContext.needToRewindHistory) {

			this.lineHistory.rewind();
		}

	}

	addToHistory(sentence: Ast.Sentence) {

		const writeContent = this.lineHistory.getContent()[this.lineHistory.getWriteHistoryIndex()];
		var replace = false;
		if (writeContent instanceof Ast.UnProcessedSentence) {
			replace = false;
		} else {
			replace = true;
		}

		this.rebuild.addHistoryEntry(sentence, {
			replace: replace,
			incrementer: (statement: Ast.Statement) => statement instanceof Ast.executableStatement ||
				statement instanceof Ast.UnProcessedSentence
		});


	}

	processByMacros(answer: basicStepprocessor.answer) {
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


	processCommand(command: Ast.Command) {

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
						} else {
							this.lineHistory.popBack();
						}
					}
					this.stepContext.addToHistory = false;


					break;
				default:
					super.processCommand(command);
			}

		} else {
			//throw ("Failed to process sentence" + JSON.stringify(command.toJson()));
		}

	}

	


	protected *runner(statement: Ast.Statement) {

		if (statement instanceof Ast.DebuggerTrap) {
			const debuggerTrapStatment = statement as Ast.DebuggerTrap;
			this.rebuild.console.log("!!Trapped - " + debuggerTrapStatment.message);
			return {
				debuggerTrap: true
			};

		}

		if (statement instanceof Ast.executableStatement) {
			yield* this.processStatementAsync(statement,{});
		}


	}

	protected *runStepNegetiveAsync_RunState(): IterableIterator<any> {

		yield * this.runStepPositiveAsync_RunState();
		
	}

	protected *runStepPositiveAsync_RunState(): IterableIterator<any> {
		while (this.lineHistory.historyIndex < this.lineHistory.writeHistoryIndex) {

			const ret = yield* this.runner(this.lineHistory.getContent()[this.lineHistory.historyIndex]);
			if (ret && ret.debuggerTrap) {

				this.status = Status.Edit;
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
			this.status = Status.Edit;
			this.lineHistory.writeHistoryIndex = this.lineHistory.historyIndex;
			return;
		}
	}

	protected *runStepPositiveAsync_EditState():IterableIterator<any>{

	}

	
	protected *runStepNegetiveAsync_EditState():IterableIterator<any>{

	}



	protected *runStepPositiveAsync(): IterableIterator<any> {
		if (this.status == Status.Run) {
			yield* this.runStepPositiveAsync_RunState();
		}

		if (this.status == Status.Edit) {
			yield* this.runStepPositiveAsync_EditState();
		}


	}


	* runStepNegetiveAsync(): IterableIterator<any> {
		if (this.status == Status.Run) {
			yield* this.runStepNegetiveAsync_RunState();
		}

		if (this.status == Status.Edit) {
			yield* this.runStepNegetiveAsync_EditState();

		}
	}



	


}




