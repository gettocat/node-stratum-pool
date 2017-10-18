var util = require('./util.js');
var BN = require('bn.js')

//its so wrong :C
var diff1 = global.diff1 = 0x00000000ffff0000000000000000000000000000000000000000000000000000;//2e53 its limit for js v8

global.getMaxTarget = function() {
    return 0x1f00ffff;//for orwell network only
}

global.bits2targetBN = function(bits) {
    var p = parts(bits), F = new BN(8 * (p[0] - 3), 10), tmp = new BN(2, 10).pow(F), R = new BN(p[1], 10).mul(tmp);
    return R;
}

global.bits2target = function(bits) {
    return bits2targetBN(bits).toBuffer('be', 32);
}

global.parts = function(bits) {
    var exp = bits >> 24,
            mant = bits & 0xffffff;
    return [exp, mant];
}

var algos = module.exports = global.algos = {
    sha256: {
        //Uncomment diff if you want to use hardcoded truncated diff
        //diff: '00000000ffff0000000000000000000000000000000000000000000000000000',
        hash: function(){
            return function(){
                return util.sha256d.apply(this, arguments);
            }
        }
    }
};


for (var algo in algos){
    if (!algos[algo].multiplier)
        algos[algo].multiplier = 1;
}
