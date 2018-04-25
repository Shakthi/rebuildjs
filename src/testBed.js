"use strict";

var testreadline = {
	finished: false
};

var testreadlineFinishCallBack = null;

var historyCompleter;

var historyArray;
var index = 0;



testreadline.init = function(ahistoryArray, atestreadlineFinishCallBack) {
	index = 0;
	historyArray = ahistoryArray.slice(0);
	testreadlineFinishCallBack = atestreadlineFinishCallBack;

};

testreadline.getLine = function(options) {

	if (options) {
		if (options.history) {

			historyCompleter = options.history;
		}
	}

	historyCompleter.onEditBegin();
	historyCompleter.onEditEnd();

	var ret = Promise.resolve({
		line: historyArray[index],
		historyEdited: false,
		bufferEdited: true
	});
	index++;
	if (index >= historyArray.length) {
		this.finished = true;
		if (testreadlineFinishCallBack) {
			testreadlineFinishCallBack();
		}
	}

	return ret;


};


exports.selftest = function() {


	var rebuild = this;



	if (rebuild.testCommand) {
		var oldReadline = rebuild.setReadline(testreadline);

		testreadline.init(rebuild.testCommand.split(';'), function() {

			rebuild.setReadline(oldReadline);

		});

		if (rebuild.options.executeCommandLineNormally)
			return Promise.resolve("end test command");


	} else {

		if (rebuild.options.needSelfTest) {
			testreadline.init(rebuild.lineHistory.getContent());
			rebuild.SetHistoryEnabled(false);
			//rebuild.console.setEnabled(false);


		} else {
			return Promise.resolve();
		}


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