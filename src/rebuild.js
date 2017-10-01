var readline = require('./readline.js');
var history = require('./history.js');
var fs = require('fs');


var stepprocessor = require('./stepprocessor.js');


if (!Array.prototype.last) {
	Array.prototype.last = function() {
		return this[this.length - 1];
	};
};



var processorStack = [];
var lineHistory = new history();



exports.runStep = function() {


	var promise = null;

	if (processorStack.length == 0) {
		return Promise.reject("empty processor");
	}

	if (processorStack.last().isDead) {
		processorStack.pop();
		return Promise.resolve("stack pop");
	}


	return processorStack.last().runStep();


}

exports.getLine = readline.getLine;

exports.init = function() {

	processorStack.push(new stepprocessor.echoProcessor(exports, lineHistory));
}

exports.save = function() {

	var obj = {
		lineHistory: lineHistory.toJson()
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