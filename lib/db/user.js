var dbentry = require('./entry');
var util = require('util');
var obj = null;

var user = function () {
    this.name = 'user';
    this.options = {inmemory: false};
    this.init();
}

util.inherits(user, dbentry);

user.prototype.getUser = function (address) {
    return this.find({address: address})[0];
}

user.prototype.createUser = function (address) {
    var obj = this.insert({
        id: this.count() + 1,
        address: address,
        last_login: new Date().getTime() / 1000,
        last_submit: -1,
        balance: 0,
        last_payout: -1,
    });

    return obj;
}

module.exports = obj ? obj : obj = new user;
