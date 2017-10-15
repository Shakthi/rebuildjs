Array.prototype.last = function() {
	return this[this.length - 1];
};
Array.prototype.top = Array.prototype.last;
Array.prototype.empty = function() {
	return (this.length == 0);
};


var promptManager = require('./PromptManager.js');

var fs = require('fs');
var readline = require('./readline.js');
var history = require('./history.js');
var stepprocessor = require('./basicStepprocessor.js').BasicStepProcessor;



var processorStack = [];
var lineHistory = new history();

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
	return readline.getLine(options);
}

exports.addNewProcessor = function(argument) {

	if (!processorStack.empty())
		promptManager.push(processorStack.top().getPrompt());


	processorStack.push(argument);

}

exports.exitProcessing = function() {


	promptManager.pop();
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