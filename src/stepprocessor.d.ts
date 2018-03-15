// Type definitions for ./src/stepprocessor.js
// Project: [LIBRARY_URL_HERE] 
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]> 
// Definitions: https://github.com/borisyankov/DefinitelyTyped


declare namespace defaultSpace {

	enum DeathReason {
		abort,
		normal
	}

	class stepProcessor {


		

		constructor(rebuild: any, history: any);
		onEnter(): void;
		getPrompt(): string;
		getHistory(): any;
		setPrompt(aprompt: string): void;
		markDead(deathReason: string): void;
		onExit(): void;

	}
}
export = defaultSpace;