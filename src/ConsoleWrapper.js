"use strict";
//ConsoleWrapper

var enabled = true;

exports.log = function(argument) {
	if (enabled) {
		console.log(">" + argument);
	}

};

exports.info = function(argument) {
	if (enabled) {
		console.log("//" + argument);
	}

};

exports.write = function(argument) {
	if (enabled) {
		process.stdout.write(argument);
	}

};


exports.setEnabled = function(argument) {
	enabled = argument;
};