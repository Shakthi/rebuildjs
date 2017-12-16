"use strict";
const ast = require("./ast.js");
const JisonParser = require("jison").Parser;


const basicStatmentFun = "\n" +
    "    var basicStatments = ['print', 'let', 'read', 'if', 'for','end','to']; \n" +
    "\n";



const grammar = {
    // "options": {
    //     "debug": "true"
    // },
    "lex": {
        "macros": {
            "digit": "[0-9]",
            "esc": "\\\\",
            "int": "[0-9]+",
            "exp": "(?:[eE][-+]?[0-9]+)",
            "frac": "(?:\\.[0-9]+)",
            "letter": "[a-z]"

        },
        "rules": [
            ["^[ ]*\\.{letter}+", "var yytexTrimmed = yytext.trim(); yytext=yytexTrimmed.substring(1);  return 'COMMAND';"],
            ["{letter}+", "var yytexTrimmed = yytext.trim();  if(basicStatments.indexOf(yytexTrimmed)!= -1) return yytexTrimmed; else return 'identifier';  "],
            ['"(\\ .|[^"])*"', 'yytext=yytext.substring(1,yytext.length-1); return "STRING_LITERAL";'],


            ["\\s+", "/* skip whitespace */"],
            ["{int}{frac}?{exp}?\\b", "return 'NUMBER';"],
            ["\"(?:{esc}[\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\"{esc}])*\"", "yytext = yytext.substr(1,yyleng-2); return 'STRING';"],
            ["\\,", "return ','"],
            ["\\+", "return '+'"],
            ["\\*", "return '*'"],
            ["\\-", "return '-'"],
            ["\\/", "return '/'"],
            ["\\%", "return '%'"],
            ["\\(", "return '('"],
            ["\\)", "return ')'"],
            ["\\<", "return '<'"],
            ["\\>", "return '>'"],
            ["\\=", "return '='"],

            ["$", "return 'EOF'"],



            ["true\\b", "return 'TRUE'"],
            ["false\\b", "return 'FALSE'"],
            ["null\\b", "return 'NULL'"]



        ],
        actionInclude: basicStatmentFun


    },

    "operators": [
        ["left", "+", "-"],
        ["left", "*", "/"],
        ["left", "^"],
        ["right", "!"],
        ["right", "%"],

    ],

    "start": "sentence",

    "bnf": {
        "sentence": [
            ["print printedItemList EOF", "$$ = new yy.printStatement($2); return($$);"],
            ["let identifier = e EOF", "$$ = new yy.letStatement($2,$4); return($$);"],
            ["readStatement EOF", "$$=$1; return($$);"],
            ["end EOF", "$$= new yy.endStatement(); return($$);"],
            ["for identifier = e to e EOF", "$$= new yy.forStatement($2,$4,$6); return($$);"],
            ["COMMAND", "$$ = new yy.CustomCommand($1); return($$); "],


        ],

        "printedItemList": [
            ["printedItem", "$$ = [ $1 ]"],
            ["printedItemList , printedItem", "$1.push($3); $$ = $1;"]
        ],

        "printedItem": [
            ["e", "$$ = $1"],
            ["es", "$$ = $1"]
        ],



        "readStatement": [
            ["read STRING_LITERAL , readList", "$$=new yy.readStatement($4,$2);"],
            ["read readList", "$$=new yy.readStatement($2,null);"]
        ],
        "readList": [
            ["identifier", "$$ = [ $1 ]"],
            ["readList , identifier", "$1.push($3); $$ = $1;"]
        ],



        "e": [
            ["e + e", "$$ =  new  yy.binaryExpression('+', $1,$3); "],
            ["e - e", "$$ = new  yy.binaryExpression('-', $1,$3);"],
            ["e * e", "$$ = new  yy.binaryExpression('*', $1,$3);"],
            ["e / e", "$$ = new  yy.binaryExpression('/', $1,$3);"],
            ["- e", "$$ = new  yy.unaryExpression('UMINUS', $2);", {
                "prec": "UMINUS"
            }],
            ["( e )", "$$ = new  yy.unaryExpression('GROUP', $2);"],
            ["NUMBER", "$$ = new  yy.terminalExpression(Number(yytext))"],
            ["identifier", "$$ = new  yy.getExpression(yytext)"],

        ],


        "es": [
            ["STRING_LITERAL", "$$ = new  yy.terminalExpression(yytext)"],
        ]
    },

};

const jisonParser = new JisonParser(grammar);
jisonParser.yy = ast;

const parser = {
    parse: function(argument) {
        var result = null;
        try {
            result = jisonParser.parse(argument);
            result.src = argument;
        } catch (e) {

            var message = "";
            if (e.hash) {

                if (e.hash.expected) {

                    var expected = e.hash.expected;
                    message = 'ERROR, Expected:';
                    expected.forEach(function(argument) {
                        message += argument;
                        message += ',';
                    });

                    message += "Found '" + e.hash.token + "'" + "('" + e.hash.text + "')";

                } else if (e.message) {
                    message = e.message;
                }
            }
            result = new ast.errorStatement(message);
            result.src = argument;
        }

        return result;
    }
};

exports.parser = parser;