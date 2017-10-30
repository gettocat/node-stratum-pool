
var Stratum = require('./lib/index');
var util = require('./lib/util')
var manager = require('./lib/manager/index')
var config = require('./config')
require("./www/index")

var pool = Stratum.createPool(config, function (ip, port, workerName, password, callback) { //stratum authorization function
    console.log("Authorize " + workerName + ":" + password + "@" + ip);
    var data = manager.user.getWorkerName(workerName);

    if (!data.isValidAddress) {
        callback({
            error: 'invalid format of login, need rewardAddress/workerId',
            authorized: false,
            disconnect: true
        });
    } else {
        //set last login to user
        manager.user.updateLogin.apply(null, [
            data.address,
            data.worker
        ]);
        //and to worker

        callback({
            error: null,
            authorized: true,
            disconnect: false
        });
    }

});

pool.on('share', function (isValidShare, isValidBlock, data, daemon) {
    //add share to db,
    //update user balance

    if (data.blockHash)//now pay only for right block founded, when nw hr grown up - will be pay for all valid shares.
        manager.share.updateShare.apply(null, [data]);

    //todo, save stats about worker:
    if (isValidBlock)
        console.log('Block found');
    else if (isValidShare) {
        console.log('Valid share submitted');
    } else if (data.blockHash)
        console.log('We thought a block was found but it was rejected by the daemon');
    else
        console.log('Invalid share submitted')

    manager.share.calc(daemon);
    console.log('share data: ' + JSON.stringify(data), 'isValidBlock:'+isValidBlock, "isValidShare:"+isValidShare);
});

pool.on('log', function (severity, logKey, logText) {
    if (severity != 'debug')
        console.log(severity + ': ' + '[' + logKey + '] ' + logText);
});

pool.start();