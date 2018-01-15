"use strict";

require('./utils.js');


const ast = require("./ast.js");
const assert = require('assert');

/* history array contains entries like this.
["firstaddedentry",""secondaddedentry",...."justaddedentry"]
*/


class SentenceHistory {

	constructor() {
		this.history = [];
		this.historyIndex = 0;
		this.lastEditedIndex = 0;
		this.currentBuffer = '';
	}


	checkDuplicate(entry) {

		if (!this.history.length)
			return true;

		if (this.history.top().isEqual(entry))
			return false;

		return true;
	}

	add(entry,options) {

		if (this.checkDuplicate(entry, options)) {
			this._internalAdd(entry,options);

		}
	}

	_internalAdd(entry) {

		this.history.push(entry);
	}


	onEditBegin() {

		this._internalAdd(new ast.UnProcessedSentence());
		this.historyIndex = this.history.length - 1;

	}

	onEditEnd() {
		if (!this.isAtBeginPosition()) {
			this.lastEditedIndex = this.historyIndex;
		} else {
			this.historyIndex--;
			this.lastEditedIndex = -1;
		}

		this.history.pop();

	}

	isAtBeginPosition() {
		return this.historyIndex == this.history.length - 1;
	}

	edit(direction, currentBuffer) {

		var success = true; //current buffer is changed

		assert(this.history.length);



		//save current buffer only if it is at the begning
		if (this.isAtBeginPosition() && direction !== 'none') {
			this.currentBuffer = currentBuffer;
		}



		if (direction === 'next') {

			if (this.historyIndex < this.history.length - 1) {
				this.historyIndex++;
			} else {
				success = false;
			}

		} else if (direction === 'previous') {

			if (this.historyIndex > 0) {
				this.historyIndex--;
			} else
				success = false;

		} else if (direction == 'none') {

			success = true;

		}


		if (direction === 'none') {
			return {
				success: success,
				historyEdited: false,
				result: this.history[this.historyIndex].toCode()
			};
		}

		if (this.isAtBeginPosition()) {
			return {
				success: success,
				historyEdited: false,
				result: this.currentBuffer
			};

		} else {
			return {
				success: success,
				historyEdited: true,
				result: this.history[this.historyIndex].toCode()
			};
		}

	}


	getContent() {
		return this.history;
	}

	forEach(fun,that){
		this.history.forEach(fun,that);
	}

	getLastEditedEntry() {
		return this.history[this.lastEditedIndex];
	}



	fromJson(jsonobj) {

		this.history = jsonobj.content.map(function(argument) {
			return ast.createSentenceFromJson(argument);
		});
	}

	toJson() {

		const contentJSON = this.history.map(function(argument) {
			return ast.sentenceToJson(argument);
		});

		return {
			name: "SentenceHistory",
			content: contentJSON
		};

	}

}



module.exports = exports = SentenceHistory;