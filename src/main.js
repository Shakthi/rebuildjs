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
				 return result.returnValue;
			}
			
			return runloop(result);


		} catch (reason) {
			throw (reason);
		}


	}

	const returnValue = await runloop();
	if(require.main === module)
		console.log("Finished with", returnValue);
	else
		return returnValue;


}

if(require.main === module)
 main(process.argv);

 module.exports = main;