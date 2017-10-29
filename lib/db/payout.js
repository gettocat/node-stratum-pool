var dbentry = require('./entry');
var util = require('util');
var obj = null;

var payout = function () {
    this.name = 'payout';
    this.options = {inmemory: false};
    this.init();
}

util.inherits(payout, dbentry);

payout.prototype.createPayment = function (address, amount) {

    var obj = this.insert({
        address: address,
        id: this.count() + 1,
        added: new Date().getTime() / 1000,
        amount: amount,
        payed: 0
    });

    return obj;
}

payout.prototype.getUnpayed = function () {

    return this.findAndSort({
        'payed': {'$ne': 1}
    }, 'added', 'asc');

}

module.exports = obj ? obj : obj = new payout;
