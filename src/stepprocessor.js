 var lineHistory = require('./history.js');

 var prompt = "";
 var stepProcessor = function(rebuild, history) {

 	this.rebuild = rebuild;
 	if (history)
 		this.lineHistory = history;
 	else
 		this.lineHistory = new lineHistory();

 }

 stepProcessor.prototype.onEnter = function() {

 };

 stepProcessor.prototype.getPrompt = function() {
 	return prompt;
 };

 stepProcessor.prototype.setPrompt = function(aprompt) {
 	prompt = aprompt;
 	return this.rebuild.setPrompt(aprompt);

 }



 stepProcessor.prototype.onExit = function() {

 };



 var echoProcessor = function(rebuild, history) {

 	stepProcessor.call(this, rebuild, history);

 	this.setPrompt('rebuildx}');
 }

 echoProcessor.prototype = Object.create(stepProcessor.prototype);



 echoProcessor.prototype.runStep = function() {

 	var self = this;
 	return new Promise(function(resolve, reject) {

 		self.rebuild.getLine({
 			history: self.lineHistory,
 			prompt: self.setPrompt('rebuildx}')
 		}).then(function(answer) {


 			if (answer != "") {

 				self.lineHistory.add(answer);

 			} else {

 				self.isDead = true;

 			}

 			resolve();

 		});

 	});



 };


 exports.echoProcessor = echoProcessor;
 exports.stepProcessor = stepProcessor;