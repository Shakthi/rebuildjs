var history = [];
var historyIndex = 0;

var lineHistory = function(argument) {

}


lineHistory.prototype.edit = function(direction, currentBuffer) {
	var success = true;
	if (history.length > 1) {
		history[history.length - 1 - historyIndex] = currentBuffer;
		historyIndex += (direction === 'previous') ? 1 : -1;

		if (historyIndex < 0) {
			historyIndex = 0;
			success = false;

		} else if (historyIndex >= history.length) {
			historyIndex = history.length - 1;
			success = false;
		}
	} else {
		success = false;
	}

	return {
		result: history[history.length - 1 - historyIndex],
		success: success
	};
};

lineHistory.prototype.onEditBegin = function() {
	historyIndex = 0;
	history.push('');
};


lineHistory.prototype.onEditEnd = function() {
	history.pop('');
};

lineHistory.prototype.getContent = function() {
	return history;
};


lineHistory.prototype.add = function(entry) {
	if (history.length) {
		if (history[history.length - 1] == entry)
			return;
	}

	history.push(entry);

};

lineHistory.prototype.fromJson = function(argument) {
	history = argument.history;
};

lineHistory.prototype.toJson = function() {
	return {
		history: history
	};
};



module.exports = exports = lineHistory;