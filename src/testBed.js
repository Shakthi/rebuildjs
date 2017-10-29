var testreadline = {};

var historyCompleter;

var historyArray;
var index = -1;

const stepprocessor = require('./basicStepprocessor.js').BasicStepProcessor;


testreadline.init = function(ahistoryArray) {
	historyArray = ahistoryArray.slice(0);
}

testreadline.getLine = function(options) {
	index++;
	if (options) {
		if (options.history) {

			historyCompleter = options.history;
		}
	}

	historyCompleter.onEditBegin();
	historyCompleter.onEditEnd();

	if (index >= historyArray.length) {
		debugger;
		return Promise.reject("endTest");
	}


	return Promise.resolve(historyArray[index]);


}


exports.selftest = function() {

	var rebuild = this;

	return new Promise(function(resolve, reject) {

		testreadline.init(rebuild.lineHistory.getContent());
		var oldReadline = rebuild.setReadline(testreadline);

		var runloop = function() {

			rebuild.runStep().then(function(message) {

				runloop();

			}).catch(function(reason) {

				if (reason == "endTest") {
					rebuild.console.log("Finished test ");
					rebuild.setReadline(oldReadline);

					resolve("endTest");

				} else {
					
					reject(reason);
				}
			})

		}

		runloop();



	});


}



exports.testreadline = testreadline;