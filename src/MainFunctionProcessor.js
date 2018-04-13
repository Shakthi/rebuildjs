"use strict";
const FunctionProcessor = require("./FunctionProcessor");
const Ast = require("./ast.js");
const varTable = require('./varTable.js');
class MainFunctionProcessor extends FunctionProcessor {
    constructor(rebuild, history, options) {
        super(rebuild, new Ast.functionExpression("main", []), new varTable(), [], options);
    }
    archiveStatement() {
    }
    unarchiveStatement(val) {
    }
}
module.exports = MainFunctionProcessor;
