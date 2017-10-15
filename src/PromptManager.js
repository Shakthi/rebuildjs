var lastPromptString = "";
var lastPromptList = [];




exports.push = function(argument) {

	lastPromptList.push(argument);
	lastPromptString = "";
	lastPromptList.forEach(function(argument) {
		lastPromptString += argument;
	});
}

exports.pop = function() {

	if (!lastPromptList.empty())
		lastPromptList.pop();

	lastPromptString = "";
	lastPromptList.forEach(function(argument) {
		lastPromptString += argument;
	});

}

exports.getPrompt = function() {
	return lastPromptString;
}

exports.setPrompt = function(currentPrompt) {

	return exports.getPrompt() + currentPrompt;
}

