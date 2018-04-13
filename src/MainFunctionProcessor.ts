import FunctionProcessor = require('./FunctionProcessor');
import Ast = require('./ast.js');
const varTable = require('./varTable.js');

class MainFunctionProcessor extends FunctionProcessor {

    constructor(rebuild: any,
        history:any[],
        options: any) {
        super(rebuild,new Ast.functionExpression("main",[]),new varTable(),[],options)

    }
    archiveStatement() {
        
    }
    unarchiveStatement(val:boolean) {
        
    }
}


export = MainFunctionProcessor;
