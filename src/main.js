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
			if (result === rebuild.EOEToken) {
				rebuild.save();
				return console.log("Finished with", result.returnValue);
			}
			
			runloop(result);


		} catch (reason) {
			throw (reason);
		}


	}

	runloop();

}

main(process.argv);