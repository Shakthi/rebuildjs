"use strict";
const readline = require('readline');

var historyCompleter = {

	edit: function() {
		return {
			result: "ssss",
			success: false
		};
	},

	onEditEnd: function() {

	},

	onEditBegin: function() {

	}
};

var sessionRecorder = null;
var self = null;
var historyEdited = false;
var bufferEdited = false;

function historyReplace(responce) {

	//console.log("historyReplace:", responce);
	if (responce.success) {

		self.line = responce.result;
		self.cursor = self.line.length;
		historyEdited = responce.historyEdited;

		self._refreshLine();

	}



}


function historyNext() {

	historyReplace(historyCompleter.edit('next', self.line));
}


function historyPrevious() {

	historyReplace(historyCompleter.edit('previous', self.line));
}


function historyPrevious() {

	historyReplace(historyCompleter.edit('previous', self.line));
}


exports.getLine = function(options) {

	historyEdited = false;
	bufferEdited = false;

	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	if (options) {
		if (options.history) {

			historyCompleter = options.history;
		}
		if (options.recordSession) {
			if (sessionRecorder === null) {
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
	const oldHistoryResult = historyCompleter.edit('none', "");;
	rl.write(oldHistoryResult.result);

	var ttyWriteOrig = rl._ttyWrite.bind(rl);



	return new Promise(resolve => {


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

			} else if (key.ctrl && options.macros && options.macros.includes(key.name)) {

				historyCompleter.onEditEnd();
				rl.close();
				const result = {
					line: "",
					historyEdited,
					bufferEdited,
					key,
					prefilled: oldHistoryResult.result !== ''
				};

				resolve(result);

			} else {
				var oldline = this.line;
				ttyWriteOrig(d, key);
				if (oldline !== this.line) {
					bufferEdited = true;
				}

			}
		};


		rl.on('line', (line) => {

			historyCompleter.onEditEnd();
			rl.close();
			const result = {
				line,
				historyEdited,
				bufferEdited,
				prefilled: oldHistoryResult.result !== ''
			};
			//console.log("//historyReplace:", result);

			resolve(result);

		});

	});
};


exports.getRecordedSession = function() {
	return sessionRecorder;
};