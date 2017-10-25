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


exports.selftest = function() {


	var rebuild = this;


	testreadline.init(rebuild.lineHistory.getContent());
	var oldReadline = rebuild.setReadline(testreadline);

	var runloop = function() {

		rebuild.runStep().then(function(message) {

			runloop();

		}).catch(function(reason) {

			if (reason == "empty processor") {
				rebuild.console.log("Finished ");
				rebuild.setReadline(oldReadline);

			} else {

			}
		})

	}


	runloop();


}



exports.testreadline = testreadline;