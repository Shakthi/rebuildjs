"use strict";

Array.prototype.last = function() {
	return this[this.length - 1];
};
Array.prototype.top = Array.prototype.last;
Array.prototype.empty = function() {
	return (this.length == 0);
};

Array.prototype.first = function() {
	return this[0];
};