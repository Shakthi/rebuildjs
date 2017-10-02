var stepProcessors = require('./stepprocessor.js').stepProcessor;

function BasicStepProcessor(rebuild,history) {

	stepProcessors.call(this,rebuild,history);	
	
}

BasicStepProcessor.prototype = Object.create(stepProcessors.prototype);


BasicStepProcessor.prototype.runStep = function() {

	var self = this;
	return new Promise(function(resolve, reject) {

		self.rebuild.getLine({
			history: self.lineHistory,
			prompt: self.setPrompt('rebuildx}')
		}).then(function(answer) {


			if (answer != "") {

				self.lineHistory.add(answer);
				console.log("rebuild>" + answer);

			} else {

				self.isDead = true;

			}

			resolve();

		});

	});



};