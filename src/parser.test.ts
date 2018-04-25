

import parser = require('./parser.js')
import ast = require('./ast.js')

var test = require('tape');

test('Test if print statement parsed', function (t) {
    //t.plan(2);

    t.ok(parser.parser.parse('print 12') instanceof ast.printStatement);
    t.ok(parser.parser.parse('print 13,2').elements[1].terminalValue == 2);
    t.end();
});


test('Test if function call statement parsed', function (t) {
    t.ok(parser.parser.parse('print max(1,2)') .elements[0] instanceof ast.functionExpression);
    t.ok(parser.parser.parse('print max(1,2)') .elements[0].parameters[0].terminalValue === 1 );
    
    t.end();
});



test('Test if function definintion statement parsed', function (t) {

    console.log(parser.parser.parse('defun add(a :1,b:4)').argumentList[0].value);
    t.ok(parser.parser.parse('defun add(a :1,b:1)')  instanceof ast.functionDefine);
    t.ok(parser.parser.parse('defun add(a :1,b:2)') .argumentList[0].value instanceof ast.terminalExpression );

    t.end();
});



