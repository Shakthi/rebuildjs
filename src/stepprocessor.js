var lineHistory = require('./history.js');


var echoProcessor = function(rebuild,history) {

	this.rebuild = rebuild;
	if(history)
		this.lineHistory = history;
	else		
		this.lineHistory = new lineHistory();



}





echoProcessor.prototype.runStep = function() {

	var self = this;
	return new Promise(function(resolve, reject) {

		self.rebuild.getLine({history:self.lineHistory}).then(function(answer) {


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


exports.echoProcessor = echoProcessor;