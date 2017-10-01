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

var self;


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

	if (options && options.history) {

		historyCompleter = options.history;
	}


	self = rl;

	self.setPrompt('');
	historyCompleter.onEditBegin();



	var ttyWriteOrig = rl._ttyWrite.bind(rl);

	rl._ttyWrite = function(d, key) {

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