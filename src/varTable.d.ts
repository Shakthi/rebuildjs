
declare class VarTable {

	constructor();
	superEntry:VarTable;
	getEntry(key:string):any;

	setEntry(key:string, argument:any):void;

}


