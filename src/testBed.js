"use strict";

var testreadline = {
	finished: false
};

var testreadlineFinishCallBack = null;

var historyCompleter;

var historyArray;
var index = 0;

const stepprocessor = require('./basicStepprocessor.js').BasicStepProcessor;


testreadline.init = function(ahistoryArray, atestreadlineFinishCallBack) {
	historyArray = ahistoryArray.slice(0);
	testreadlineFinishCallBack = atestreadlineFinishCallBack;

}

testreadline.getLine = function(options) {

	if (options) {
		if (options.history) {

			historyCompleter = options.history;
		}
	}

	historyCompleter.onEditBegin();
	historyCompleter.onEditEnd();

	var ret = Promise.resolve(historyArray[index++]);
	if (index >= historyArray.length) {
		this.finished = true;
		if (testreadlineFinishCallBack) {
			testreadlineFinishCallBack();
		}
	}

	return ret;


}


exports.selftest = function() {


	var rebuild = this;

	if (!rebuild.options.needSelfTest) {
		return Promise.resolve();
	}

	var oldReadline = rebuild.setReadline(testreadline);

	if (rebuild.testCommand) {
		testreadline.init(rebuild.testCommand.split(';'), function() {

			rebuild.setReadline(oldReadline);

		});

		if (rebuild.options.executeCommandLineNormally)
			return Promise.resolve("end test command");


	} else {
		testreadline.init(rebuild.lineHistory.getContent());
		rebuild.SetHistoryEnabled(false);
		//rebuild.console.setEnabled(false);
	}



	function endTest() {
		//rebuild.console.log("Finished test ");
		rebuild.setReadline(oldReadline);
		rebuild.SetHistoryEnabled(true);
		rebuild.console.setEnabled(true);

	}

	return new Promise(function(resolve, reject) {


		var runloop = function() {

			if (testreadline.finished) {
				endTest();
				resolve("end selftest");

			} else {

				rebuild.runStep().then(function(message) {

					runloop();

				});
			}



		}

		runloop();



	});


}



exports.testreadline = testreadline;