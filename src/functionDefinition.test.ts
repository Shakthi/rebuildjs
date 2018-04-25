
const mainTest2 = require('./main.js')
var test = require('tape');


test('Test function defintion works from main', function (t) {
    (async function l() {        
        let returned = await mainTest2(["--testCommand=defun afun(num:10);return num*2; return afun(23)+1"]);
        t.equal(returned.value,47,"Function defintion and call return  works" )
        t.end();
    })();
    
})


test('Test function defintion works from main', function (t) {
    (async function l() {        
        let returned = await mainTest2(["--testCommand=print bfun(11);return 13; return bfun(23)+1"]);
        t.equal(returned.value,14,"Function inline creations  works" )
        t.end();
    })();
    
})