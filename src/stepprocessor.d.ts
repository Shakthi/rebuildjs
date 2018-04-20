// Type definitions for ./src/stepprocessor.js
// Project: [LIBRARY_URL_HERE] 
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]> 
// Definitions: https://github.com/borisyankov/DefinitelyTyped


declare namespace defaultSpace {

	enum DeathReason {
		abort,
		normal,
		returned
	}

	class stepProcessor {


		
		rebuild:any;
		constructor(rebuild: any, history: any);
		onEnter(): void;
		getPrompt(): string;
		getHistory(): any;
		setPrompt(aprompt: string): void;
		markDead(deathReason: DeathReason,result?:any): void;
		returnStep(result:any): any;
		getReturnStepValue(): any;
		onExit(): void;

		runStep(argument:any):Promise<void>;

	}
}
export = defaultSpace;