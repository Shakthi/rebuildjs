"use strict";

var lineHistory = require('./history.js');
const Enum = require('enum');



var stepProcessor = function(rebuild, history) {

	this.rebuild = rebuild;
	if (history)
		this.lineHistory = history;
	else
		this.lineHistory = new lineHistory();

	this.isDead = false;
	this.deathReason = DeathReason.unknown;
	this.prompt = "";

};


var DeathReason = new Enum(['unknown', 'normal', 'abort','returned','undead',]);

stepProcessor.prototype.onEnter = function() {

};

stepProcessor.prototype.getPrompt = function() {
	return this.prompt;
};


stepProcessor.prototype.getHistory = function() {
	return this.lineHistory;
};


stepProcessor.prototype.setPrompt = function(aprompt) {
	this.prompt = aprompt;
	return this.rebuild.setPrompt(aprompt);

};


stepProcessor.prototype.markDead = function(deathReason = DeathReason.normal,result) {
	this.isDead = true;
	this.deathReason = deathReason;
	this.result = result;
};


stepProcessor.prototype.onExit = function() {

};



var echoProcessor = function(rebuild, history) {

	stepProcessor.call(this, rebuild, history);

	this.setPrompt('rebuildx}');
};

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
exports.DeathReason = DeathReason;