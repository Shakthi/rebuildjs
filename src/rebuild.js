
"use strict";
require('./utils.js');

const promptManager = require('./PromptManager.js');

const fs = require('fs');
const readline = require('./readline.js');
const testBed = require('./testBed.js');
const SentenceHistory = require('./sentenceHistory.js');
const stepprocessor = require('./basicStepprocessor.js').BasicStepProcessor;
const stepprocessors = require('./stepProcessor.js');
const ast = require('./ast.js');
const vartable = require('./varTable.js');
const assert = require('assert');


const processorFactory = require('./processorFactory.js');
const options = require('./options.js');
const functionProcessor = require('./FunctionProcessor.js');
const mainFunctionProcessor = require('./MainFunctionProcessor.js');





const consolewrapper = require('./ConsoleWrapper.js');


const processorStack = [];
var nextProcessor = null; 

const historyStack = [];

const lineHistory = new SentenceHistory();

var currentReadlile = readline;
var isHistoryEnabled = true;


var rebuild = {};

rebuild.options = options;


rebuild.functionProcessorList = [];
rebuild.lineHistory = lineHistory;
rebuild.console = consolewrapper;
rebuild.isAlive = true;

rebuild.runStep = async function (argument) {



	if (nextProcessor) {

		rebuild.enterProcessing(nextProcessor);
		nextProcessor = null;


	}

	if (processorStack.length === 0) {
		throw ("empty processor");
	}

	const lastResult = await processorStack.last().runStep(argument);
	
	//Fall back for lazy one
	if (typeof lastResult === 'undefined') {
		return undefined;
	}
	
	
	if (typeof lastResult === 'object' && lastResult.done) {
		rebuild.exitProcessing();
		return (lastResult.value);
	}

	//We only route the result when moving between processor
	if (typeof lastResult === 'object' && lastResult.done=== false) {
		return undefined;
	}


	return lastResult; //Route simple vaules like we recieve from promise

};

rebuild.getLine = function (options) {
	options.recordSession = true;
	return currentReadlile.getLine(options);
};

rebuild.getHistoryStack = function () {
	return historyStack;
};


rebuild.SetHistoryEnabled = function (value) {
	isHistoryEnabled = value;
};

rebuild.addHistoryEntry = function (entry, options) {
	if (isHistoryEnabled)
		historyStack.top().add(entry, options);
};



rebuild.addNewProcessor = function (argument) {
	assert(nextProcessor == null);
	nextProcessor = argument;
};

rebuild.exitProcessing = function () {


	promptManager.pop();
	historyStack.pop();

	var top = processorStack.top();
	if (top instanceof functionProcessor) {
		this.functionProcessorList.pop();
	}

	processorStack.top().onExit();

	processorStack.pop();

};


rebuild.enterProcessing = function (argument) {

	if (!processorStack.empty())
		promptManager.push(processorStack.top().getPrompt());

	if (argument instanceof functionProcessor) {
		this.functionProcessorList.push(argument);
	}

	processorStack.push(argument);
	historyStack.push(processorStack.top().getHistory());

	argument.onEnter();



};

rebuild.getPrompt = function () {
	return promptManager.getPrompt();
};


rebuild.setPrompt = function (prompt) {
	return promptManager.setPrompt(prompt);
};



rebuild.init = function (argv) {

	this.testCommand = argv.testCommand;
	historyStack.push(this.lineHistory);
	var firstProcessor = new mainFunctionProcessor(this)
	this.addNewProcessor(firstProcessor);
};



rebuild.save = function () {

	var obj = {
		lineHistory: lineHistory.toJson(),
		recordedSession: readline.getRecordedSession()
	};
	fs.writeFileSync(getFileSave(), JSON.stringify(obj, null, 2), 'utf8');


};



rebuild.load = function () {
	try {

		var obj = JSON.parse(fs.readFileSync(getFileSave(), 'utf8'));
		lineHistory.fromJson(obj.lineHistory);

	} catch (e) {


	}


};


function getFileSave() {
	return process.env.HOME + "/.rebuildjs.alldb.json";
}

rebuild.setReadline = function (areadline) {

	var old = readline;
	currentReadlile = areadline;
	return old;
};

rebuild.processorFactory = processorFactory;
rebuild.selfTest = testBed.selftest;

module.exports = rebuild;