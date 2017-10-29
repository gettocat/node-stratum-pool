var dbentry = require('./entry');
var payoutdb = require('./payout')
var payManager = require('../manager/pay')
var util = require('util');
var obj = null;

var share = function () {
    this.name = 'share';
    this.options = {inmemory: false};
    this.init();
}

util.inherits(share, dbentry);

share.prototype.add = function (address, worker, height, blockReward, difficulty, shareDiff, blockDiff, hash) {
    var obj = this.insert({
        id: this.count() + 1,
        address: address,
        worker: worker,
        block_height: height,
        block_reward: blockReward,
        block_hash: hash,
        sharediff: shareDiff,
        blockdiff: blockDiff,
        difficulty: difficulty,
        added: new Date().getTime() / 1000,
        payed: 0,
    });

    return obj;
}

share.prototype.calculate = function (daemon) {
    var shifts = 10, shift_time = 3600;
    var payouts = [];
    var now = new Date().getTime() / 1000, start = now - shifts * shift_time;
    var list = this.find({
        //'$and': [
        //{added: {'$between': [start, now]}},
        //{'payed': {'$ne': 1}}
        //]
        'createdPayment': {'$ne': 1}
    });

    console.log("pool reward calulation: ", "finded shares", list.length)

    //get common difficulty
    var diff = 0, reward = 0;
    for (var i in list) {
        diff += list[i].difficulty;
        reward += parseFloat(list[i].block_reward / 1e8) * 0.98 //2% to pool op
    }


    if (list.length)
        diff /= list.length;
    else
        diff = 1;


    console.log("pool reward calulation: ", "common diff", diff, "common reward", reward);

    var users = [];
    for (var i in list) {
        if (!users[list[i].address])
            users[list[i].address] = [];

        users[list[i].address].push(list[i]);
    }

    console.log("pool reward calulation: ", "users", users.length);

    var users_parts = {};
    for (var i in users) {
        var user_shares = 0;
        for (var k in users[i]) {
            user_shares += users[i][k].difficulty;
        }

        if (users[i].length) {
            user_shares /= users[i].length;
        } else {
            user_shares = 0;
        }


        users_parts[i] = user_shares / diff;
    }


    console.log("pool reward calulation: ", "users parts", users_parts);

    var commonAmount = 0, paylength = 0;
    for (var i in users_parts) {

        if (reward * users_parts[i] >= 0) {
            commonAmount += reward * users_parts[i];
            console.log("pool reward calulation: ", "save pay for user " + i, reward * users_parts[i], 'orwl');
            payoutdb.createPayment(i, (reward * users_parts[i]))
            paylength++;
        }

    }

    for (var i in list) {
        //save share as used
        list[i].createdPayment = 1;
    }

    if (paylength > 0) {
        if (!daemon) {
            console.log("daemon not founded, check after....");
            return;
        }

        var lastpay = payManager.lastPay();
        if (new Date().getTime() / 1000 - lastpay > 8 * 60 * 60) {

            var unpayed = payoutdb.getUnpayed();
            payManager.sendTx(daemon, unpayed, function (error, result) {
                if (error)
                    console.log('error', error)
                else
                    console.log("success", result)

            })

        }
    }
}

module.exports = obj ? obj : obj = new share;
