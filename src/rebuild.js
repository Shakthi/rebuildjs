"use strict";
require('./utils.js');

const promptManager = require('./PromptManager.js');

const fs = require('fs');
const readline = require('./readline.js');
const testBed = require('./testBed.js');
const history = require('./sentenceHistory.js');
const stepprocessor = require('./basicStepprocessor.js').BasicStepProcessor;
const processorFactory = require('./processorFactory.js');
const options = require('./options.js');



const consolewrapper = require('./ConsoleWrapper.js');


const processorStack = [];
const waitingProcessorStack = [];

const historyStack = [];

const lineHistory = new history();

var currentReadlile = readline;
var isHistoryEnabled = true;


var rebuild = {};

rebuild.options = options;



rebuild.lineHistory = lineHistory;
rebuild.console = consolewrapper;
rebuild.isAlive = true;

rebuild.runStep = function() {


	return new Promise(function(resolve, reject) {


		if (!waitingProcessorStack.empty()) {

			rebuild.enterProcessing(waitingProcessorStack.shift())

		}

		if (processorStack.length == 0) {
			reject("empty processor");
		}

		processorStack.last().runStep().then(function(argument) {

			if (processorStack.last().isDead) {

				rebuild.exitProcessing();

			}

			if (!rebuild.isAlive)
				reject("request termination");
			else
				resolve("next step");


		}).catch(function(reason) {


			console.log("Caught ", reason);

		})



	})



}

rebuild.getLine = function(options) {
	options.recordSession = true;
	return currentReadlile.getLine(options);
}

rebuild.SetHistoryEnabled = function(value) {
	isHistoryEnabled = value;
}

rebuild.addHistoryEntry = function(entry) {
	if (isHistoryEnabled)
		historyStack.top().add(entry);
}



rebuild.addNewProcessor = function(argument) {

	waitingProcessorStack.push(argument);
}

rebuild.exitProcessing = function() {


	promptManager.pop();
	historyStack.pop();
	processorStack.top().onExit();

	processorStack.pop();

}


rebuild.enterProcessing = function(argument) {

	if (!processorStack.empty())
		promptManager.push(processorStack.top().getPrompt());

	processorStack.push(argument);
	historyStack.push(processorStack.top().getHistory());

	argument.onEnter();



}

rebuild.getPrompt = function() {
	return promptManager.getPrompt();
}


rebuild.setPrompt = function(prompt) {
	return promptManager.setPrompt(prompt);
}



rebuild.init = function(argv) {

	this.testCommand = argv.testCommand;
	this.addNewProcessor(new stepprocessor(rebuild, lineHistory));
}



rebuild.save = function() {

	var obj = {
		lineHistory: lineHistory.toJson(),
		recordedSession: readline.getRecordedSession()
	};
	fs.writeFileSync(getFileSave(), JSON.stringify(obj, null, 2), 'utf8');


}



rebuild.load = function() {
	try {

		var obj = JSON.parse(fs.readFileSync(getFileSave(), 'utf8'));
		lineHistory.fromJson(obj.lineHistory);

	} catch (e) {


	}


}


function getFileSave() {
	return process.env.HOME + "/.rebuildjs.alldb.json";
}

rebuild.setReadline = function(areadline) {

	var old = readline;
	currentReadlile = areadline;
	return old;
}

rebuild.processorFactory = processorFactory;
rebuild.selfTest = testBed.selftest;

module.exports = rebuild;