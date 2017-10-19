var testreadline = {};

var historyCompleter;

var historyArray;
var index = -1;



testreadline.init = function(ahistoryArray) {
	historyArray = ahistoryArray;
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

	if (index >= historyArray.length)
		return Promise.resolve("end");


	return Promise.resolve(historyArray[index]);


}


exports.rebuildTest = function() {
return;

	var oldReadline = currentReadlile;
	testReadline.init(lineHistory.getContent());
	currentReadlile = testReadline;

	this.addNewProcessor(new stepprocessor(exports, lineHistory));



	function runloop() {

		exports.runStep().then(function(message) {

			runloop();

		}).catch(function(reason) {

			if (reason == "empty processor") {
				console.log("Finished ");
				rebuild.save();
			} else
				throw (reason);
		})

	}


	runloop();

	while (processorStack.length > 1) {
		this.runStep();
	}


	currentReadlile = oldReadline;
}



exports.testreadline = testreadline;
