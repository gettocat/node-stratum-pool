var daemonImpl = require('./lib/daemon.js');
var config = require('./config')
var paydb = require('./lib/db/payout');
var manager = require('./lib/manager/index')
var dbconnection = require('./lib/db/connection')(__dirname)
var daemon = null;

var dbconn = new dbconnection('pool.db');
dbconn.create().then(init);


function init() {

    var unpayed = paydb.getUnpayed();
    if (process.argv[2]) {
        var limitAmount = parseFloat(process.argv[2]);

        initDaemon(function () {
            pay(unpayed, limitAmount)
        });

    } else
        showinfo(unpayed);

}

function initDaemon(cb) {
    if (!daemon) {
        daemon = new daemonImpl.interface(config.daemons, function (severity, message) {
            console.log('log', severity, message);
        });

        daemon.once('online', function () {
            cb(daemon);

        }).on('connectionFailed', function (error) {
            console.log('Failed to connect daemon(s): ' + JSON.stringify(error));

        }).on('error', function (message) {
            console.log(message);
        });

        daemon.init();
    } else {
        cb(daemon);
    }
}

function pay(unpayed, limitAmount) {

    var payout = [], amount = 0;
    for (var i in unpayed) {
        amount += unpayed[i].amount;
        if (amount > limitAmount && limitAmount != -1)
            break;
        payout.push(unpayed[i]);

    }


    //create tx, for payout array
    //send tx
    manager.payout.sendTx(daemon, payout, function (error, result) {
        if (error)
            console.log('error:', error)
        else
            console.log("result:", result)
        
        process.exit(0)
    })
    //save info of tx if not have errors

}

function showinfo(unpayed) {

    var amount = 0, users = [];
    for (var i in unpayed) {
        if (users.indexOf(unpayed[i].address) < 0)
            users.push(unpayed[i].address)
        amount += unpayed[i].amount;
    }

    console.log("unpayed amount of pool is " + amount + " orwel, for " + users.length + " users.");
    process.exit(0);


}