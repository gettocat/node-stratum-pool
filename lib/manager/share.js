var sharedb = require('../db/share')
var userManager = require('./user')

var shareManager = function () {

}

shareManager.updateShare = function (data) {
    //data: data: {"job":"3","ip":"::ffff:127.0.0.1","port":3256,"worker":"address","height":219,"blockReward":"500000000","difficulty":1,"shareDiff":"157144.00000000","blockDiff":32768,"blockDiffActual":"32768.000000000","blockHash":"hash"}
    var worker = userManager.getWorkerName(data.worker);

    userManager.updateSubmit.apply(null, [
        worker.address,
        worker.worker,
        data.blockReward
    ]);

    sharedb.add.apply(sharedb, [
        worker.address,
        worker.worker,
        data.height,
        data.blockReward,
        data.difficulty,
        data.shareDiff,
        data.blockDiff,
        data.blockHash
    ]);

}

shareManager.calc = function (daemon) {
    sharedb.calculate(daemon);
}

module.exports = shareManager;