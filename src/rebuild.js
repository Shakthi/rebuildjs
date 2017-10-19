Array.prototype.last = function() {
	return this[this.length - 1];
};
Array.prototype.top = Array.prototype.last;
Array.prototype.empty = function() {
	return (this.length == 0);
};


const promptManager = require('./PromptManager.js');

const fs = require('fs');
const readline = require('./readline.js');
const testBed = require('./testBed.js');
const history = require('./history.js');
const stepprocessor = require('./basicStepprocessor.js').BasicStepProcessor;


const processorStack = [];
const lineHistory = new history();

var currentReadlile = readline;

exports.runStep = function() {



	if (processorStack.length == 0) {
		return Promise.reject("empty processor");
	}

	if (processorStack.last().isDead) {

		this.exitProcessing();
		return Promise.resolve("stack pop");
	}


	return processorStack.last().runStep();


}

exports.getLine = function(options) {
	options.recordSession = true;
	return currentReadlile.getLine(options);
}

exports.addNewProcessor = function(argument) {

	if (!processorStack.empty())
		promptManager.push(processorStack.top().getPrompt());


	processorStack.push(argument);
	argument.onEnter();

}

exports.exitProcessing = function() {


	promptManager.pop();
	processorStack.top().onExit();

	processorStack.pop();

}

exports.getPrompt = function() {
	return promptManager.getPrompt();
}


exports.setPrompt = function(prompt) {
	return promptManager.setPrompt(prompt);
}



exports.init = function() {

	this.addNewProcessor(new stepprocessor(exports, lineHistory));
}



exports.save = function() {

	var obj = {
		lineHistory: lineHistory.toJson(),
		recordedSession: readline.getRecordedSession()
	};
	fs.writeFileSync(getFileSave(), JSON.stringify(obj), 'utf8');


}



exports.load = function() {
	try {

		var obj = JSON.parse(fs.readFileSync(getFileSave(), 'utf8'));
		lineHistory.fromJson(obj.lineHistory);

	} catch (e) {


	}


}


function getFileSave() {
	return process.env.HOME + "/.rebuildjs.alldb.json";
}

exports.setReadline = function(areadline) {

	var old = readline;
	readline = areadline;
	return old;
}


exports.selfTest = testBed.selftest;

