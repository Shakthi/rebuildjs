

const parserTest = require('./parser.test')

var test = require('tape');

const mainTest = require('./main.js')

test('Test if return from main works', function (t) {
    (async function l() {        
        let returned = await mainTest(["--testCommand=return 10"]);
        t.equal(returned.value , 10, "should return return value from return statement ")
        t.end();
    })();
    
});



test('Test if end from main', function (t) {
    (async function l() {        
        let returned = await mainTest(["--testCommand=end"]);
        t.equal(returned.value,0,"By defualt main return 0 as exit status" )
        t.end();
    })();
    
})





