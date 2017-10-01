var rebuild = require('./rebuild.js');


function main(argument) {

	rebuild.load();
	rebuild.init();

	function runloop() {

		rebuild.runStep().then(function(message) {

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



}
main();