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
		return Promise.reject("endTest");
	}

	if (historyArray[index] != "end")
		return Promise.resolve(historyArray[index]);
	else
		return testreadline.getLine(options);



}


exports.selftest = function() {

	var rebuild = this;

	rebuild.SetHistoryEnabled(false);
	rebuild.console.setEnabled(false);
	var oldReadline = rebuild.setReadline(testreadline);
	testreadline.init(rebuild.lineHistory.getContent());



	function endTest() {
		rebuild.console.log("Finished test ");
		rebuild.setReadline(oldReadline);
		rebuild.SetHistoryEnabled(true);
		rebuild.console.setEnabled(true);

	}

	return new Promise(function(resolve, reject) {


		var runloop = function() {

			rebuild.runStep().then(function(message) {

				runloop();

			}).catch(function(reason) {

				if (reason == "endTest") {

					endTest();
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