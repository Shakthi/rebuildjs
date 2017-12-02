var rebuild = require('./rebuild.js');


function main(arguments) {

	var argv = require('minimist')(arguments);
	rebuild.load();
	rebuild.init(argv);

	rebuild.selfTest().then(function() {


		function runloop() {

			rebuild.runStep().then(function(message) {

				runloop();

			}).catch(function(reason) {

				if (reason == "empty processor" || reason == "request termination") {
					console.log("Finished ");
					rebuild.save();
				} else
					throw (reason);
			})

		}


		runloop();


	})



}



main(process.argv);