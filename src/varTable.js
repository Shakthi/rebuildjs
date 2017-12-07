"use strict";

class VarTable {

	constructor() {
		this.entries = {};
		this.superEntry = null;
	}

	getEntry(key) {
		var ret = this.entries[key];

		if (ret) {
			return ret;
		}

		if (this.superEntry)
			return this.superEntry.get(key);

		return null;
	}


	setEntry(key, argument) {
		this.entries[key] = argument;
	}

};


module.exports = VarTable;