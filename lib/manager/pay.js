var payoutdb = require('../db/payout')
var txdb = require('../db/tx');

var payManager = function () {

}

payManager.updateShare = function (hash, amount) {

    return payoutdb.sended(hash, amount);

}

payManager.lastPay = function () {
    var lastitems = txdb.findAndSort({}, 'added', 'desc'), last =lastitems[0];
    if (!last)
        last = {added: 0};
    
    return last.added;
}

payManager.sendTx = function (daemon, payitems, cb) {
    var txinfo = {}, amount = 0;
    for (var i in payitems) {
        if (!txinfo[payitems[i].address])
            txinfo[payitems[i].address] = 0;

        txinfo[payitems[i].address] += payitems[i].amount;
        amount += payitems[i].amount;
    }

    if (Object.keys(txinfo).length > 0)
        daemon.cmd('sendmany', ['miner', JSON.stringify(txinfo)],
                function (result) {
                    var res = result[0];
                    console.log('res', JSON.stringify(res));
                    if (res.error) {
                        cb(res.error.error, null);
                    } else {
                        if (typeof res.response == 'string') {
                            txdb.savePayment(res.response, amount);
                            for (var i in payitems) {
                                payitems[i].payed = 1;
                                payitems[i].tx = res.response;
                            }
                            cb(null, res.response);
                        }
                    }

                });
    else
        cb("dont have payout to create tx", null);
}


module.exports = payManager;