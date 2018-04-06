"use strict";
var rebuild = require('./rebuild.js');


async function main(args) {

	var argv = require('minimist')(args);
	rebuild.load();
	rebuild.init(argv);

	await rebuild.selfTest();


	async function runloop(argument) {

		try {
			const result = await rebuild.runStep(argument);
			runloop(result);
		} catch (reason) {
			if (reason == "empty processor" || reason == "request termination") {
				console.log("Finished ");
				rebuild.save();
			} else
				throw (reason);
		}

	}

	runloop();

}

main(process.argv);