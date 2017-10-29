var dbentry = require('./entry');
var util = require('util');
var obj = null;

var tx = function () {
    this.name = 'tx';
    this.options = {inmemory: false};
    this.init();
}

util.inherits(tx, dbentry);

tx.prototype.savePayment = function (hash, amount) {

    var obj = this.insert({
        hash: hash,
        id: this.count() + 1,
        added: new Date().getTime() / 1000,
        amount: amount,
        payed: 1
    });

    return obj;
}

module.exports = obj ? obj : obj = new tx;
