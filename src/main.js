"use strict";
var rebuild = require('./rebuild.js');


function main(args) {

	var argv = require('minimist')(args);
	rebuild.load();
	rebuild.init(argv);

	rebuild.selfTest().then(function() {


		function runloop(argument) {

			rebuild.runStep(argument).then(function(result) {

				runloop(result);

			}).catch(function(reason) {

				if (reason == "empty processor" || reason == "request termination") {
					console.log("Finished ");
					rebuild.save();
				} else
					throw (reason);
			});

		}


		runloop();

	});



}



main(process.argv);