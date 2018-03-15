// Type definitions for ./src/StackedSentenceHistory.js
// Project: [LIBRARY_URL_HERE] 
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]> 
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/**
 * 
 */

 import Ast = require('./ast')

interface EditRet {
				
	/**
	 * 
	 */
	success : boolean;
			
	/**
	 * 
	 */
	historyEdited : boolean;
	result:string
}

declare class StackedSentenceHistory {

	
		
	/**
	 * 
	 * @param stack 
	 */
	constructor (stack : any);
		
	/**
	 * 
	 */
	init(): void;
		
	/**
	 * 
	 */
	onEditBegin(): void;
		
	/**
	 * 
	 */
	onEditEnd(): void;
		
	/**
	 * 
	 * @return  
	 */
	isAtBeginPosition(): boolean;
		
	/**
	 * 
	 * @return  
	 */
	getWriteHistoryIndex(): number;
		
	/**
	 * 
	 * @param entry 
	 * @param options 
	 * @return  
	 */
	checkDuplicate(entry : any, options : any): boolean;
		
	/**
	 * 
	 * @param entry 
	 * @param options 
	 */
	_internalAdd(entry : any, options? : any): void;
		
	/**
	 * 
	 * @param entry 
	 * @param options 
	 */
	_replace(entry : any, options : any): void;
		
	/**
	 * 
	 * @param direction 
	 * @param currentBuffer 
	 * @return  
	 */
	edit(direction : any, currentBuffer : any): EditRet;
		
	/**
	 * 
	 */
	rewind(): void;
		
	/**
	 * 
	 */
	popBack(): void;
		
	/**
	 * 
	 * @param func 
	 * @param that 
	 */
	forEach(func : any, that : any): void;


	historyIndex:number;
	writeHistoryIndex:number;
	getContent():Ast.Sentence[];
	
}

export = StackedSentenceHistory;