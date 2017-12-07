"use strict";
const readline = require('readline');

var historyCompleter = {

	edit: function(direction, currentInput) {
		return {
			result: "ssss",
			success: false
		}
	},

	onEditEnd: function() {

	},

	onEditBegin: function() {

	}
};

var sessionRecorder = null;
var self = null;


function historyReplace(responce) {

	if (responce.success) {

		self.line = responce.result;
		self.cursor = self.line.length;

		self._refreshLine();

	}



}


function historyNext() {

	historyReplace(historyCompleter.edit('next', self.line));
}


function historyPrevious() {

	historyReplace(historyCompleter.edit('previous', self.line));
}


exports.getLine = function(options) {



	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	if (options) {
		if (options.history) {

			historyCompleter = options.history;
		}
		if (options.recordSession) {
			if (sessionRecorder == null) {
				sessionRecorder = [];
			}

		}
		if (options.prompt) {
			rl.setPrompt(options.prompt);
			rl.prompt();
		}


	}



	self = rl;

	historyCompleter.onEditBegin();



	var ttyWriteOrig = rl._ttyWrite.bind(rl);

	rl._ttyWrite = function(d, key) {

		if (sessionRecorder) {
			sessionRecorder.push({
				data: d,
				key: key
			});
		}


		if (key.name == 'up') {

			historyPrevious();

		} else if (key.name == 'down') {

			historyNext();

		} else {

			ttyWriteOrig(d, key);
		}
	};


	return new Promise(function(resolve, reject) {

		rl.on('line', (line) => {

			historyCompleter.onEditEnd();
			rl.close();
			resolve(line);

		});

	});
}


exports.getRecordedSession = function(argument) {
	return sessionRecorder;
}