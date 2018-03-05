'use strict';
const superClass = require('./basicStepprocessor.js').BasicStepProcessor;

class ifProcessor extends superClass
{

    constructor(rebuild, statement, superVarTable, options) {

		super(rebuild, new StackedSentenceHistory(rebuild.getHistoryStack()), superVarTable);
		this.statement = statement;
		this.status = Status.Idle;
		this.options = options;
		this.macros += "u";


		if (!options) {
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
	

    
}