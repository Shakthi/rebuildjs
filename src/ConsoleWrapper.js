//ConsoleWrapper

var enabled = true;

exports.log = function(argument) {
	if (enabled) {
		console.log(argument);
	}

}


exports.setEnabled = function(argument) {
	enabled = argument;
}