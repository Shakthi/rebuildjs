"use strict";
const superClass = require('./sentenceHistory.js');
const ast = require('./ast.js');
const assert = require('assert');


//
// Current history stack (read and write)
//-----------
// Previous history stack(Readonly)
//-----------
//
//- -"- - -
//
//------------
// First history stack(Readonly)



class StackedSentenceHistory extends superClass {

	constructor(stack) {
		super();
		this.stack = stack;
		this.currentStackIndex = -1; //Defines index for stack we are using
		this.writeHistoryIndex = 0;

	}


	init() {

		this.currentStackIndex = this.stack.length - 1; //This is required since constructor yet to finish when new stack is added
		this.writeHistoryIndex = this.stack[this.currentStackIndex].history.length - 1;

		this._internalAdd(new ast.UnProcessedSentence());

	}

	onEditBegin() {


		this.historyIndex = this.writeHistoryIndex;
	}

	onEditEnd() {
		this.lastEditedIndex = this.historyIndex;
	}

	isAtBeginPosition() {
		return (this.historyIndex === this.writeHistoryIndex);
	}

	getWriteHistoryIndex() {
		return this.writeHistoryIndex;
	}

	checkDuplicate(entry) {

		if (this.history.length === 1 || this.history.length === 0)
			return true;

		if (this.history[this.writeHistoryIndex - 1].isEqual(entry))
			return false;

		return true;
	}


	_internalAdd(entry, options) {

		if (options && options.replace)
			this._replace(entry);
		else {
			this.history.splice(this.writeHistoryIndex, 0, entry);
			this.writeHistoryIndex++;
		}

	}

	_replace(entry) {

		this.history[this.writeHistoryIndex] = entry;
		this.writeHistoryIndex++;
		this.historyIndex = this.writeHistoryIndex;


	}

	edit(direction, currentBuffer) {

		var success = true; //current buffer is changed


		if (this.stack[this.currentStackIndex] == this) {

			const result = super.edit(direction, currentBuffer);
			if (result.success) {
				return result; //All good this just normal history browsing in current stack
			}

			//If requuested entry are below the current stack
			if (direction == "previous") {
				if (this.currentStackIndex <= 0) {
					return {
						success: false,
						historyEdited: true,
						result: currentBuffer
					};
				} else {
					this.currentStackIndex--;
					this.historyIndex = this.stack[this.currentStackIndex].history.length - 1;
					assert(this.historyIndex >= 0);

					return {
						success: true,
						historyEdited: true,
						result: this.stack[this.currentStackIndex].history.last().toCode()
					};

				}
			}

			return result; //User tried to move to next of history(future), which eill be failure

		}



		//Ok we are inside a lower stack already
		if (direction === 'previous') {

			if (this.historyIndex > 0) {
				this.historyIndex--;
			} else {

				if (this.currentStackIndex > 0) {
					--this.currentStackIndex;
					this.historyIndex = this.stack[this.currentStackIndex].history.length - 1;
					assert(this.historyIndex >= 0);
				} else {
					success = false;
				}

			}
		} else if (direction === 'next') {

			if (this.historyIndex < this.stack[this.currentStackIndex].history.length - 1) {
				this.historyIndex++;
			} else {

				if (this.currentStackIndex < this.stack.length - 1) {
					this.currentStackIndex++;
					this.historyIndex = 0;
					assert(this.stack[this.currentStackIndex].history.length);
				} else {
					success = false;
				}

			}
		}

		return {
			success: success,
			historyEdited: true,
			result: this.stack[this.currentStackIndex].history[this.historyIndex].toCode()
		};

	}



	rewind() {

		this.historyIndex = 0;
		this.writeHistoryIndex = 0;
	}


	popBack() {
		this.writeHistoryIndex--;
		this.historyIndex = this.writeHistoryIndex;
	}


	forEach(func, that) {
		var i = 0;
		var stackIndex = 0;
		this.stack.forEach(function(aFrame) {
			aFrame.history.forEach(function(sentence) {
				func.call(that, sentence, i, stackIndex);
				i++;
			});
			stackIndex++;
		});



	}
}



module.exports = StackedSentenceHistory;