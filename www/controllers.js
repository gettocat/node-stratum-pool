var sharedb = require('../lib/db/share');
var txdb = require('../lib/db/tx');
var payoutdb = require('../lib/db/payout')

module.exports = {
    index: function (req, res) {

        var shares = sharedb.find({added: {'$gt': new Date().getTime() / 1000 - 2 * 7 * 24 * 60 * 60}}, "added", "desc");
        var allshares = 0, users = {};
        for (var i in shares) {
            if (!users[shares[i].address])
                users[shares[i].address] = 0;
            users[shares[i].address]++;
            allshares++;
        }

        var stats = [];
        for (var i in users) {
            stats.push({
                worker: i,
                shares: users[i],
                persent: (users[i] / allshares) * 100
            })
        }

        var submits = sharedb.findAndSort({}, "added", "desc", 100, 0);
        var payouts = txdb.findAndSort({payed: 1}, "added", "desc", 100, 0);
        var data = {
            stats: stats,
            submits: submits,
            payouts: payouts,
            title: 'main page'
        };

        if (req.params.format == 'json') {
            res.write(JSON.stringify(data));
        } else
            res.render('index', data)
    },
    worker: function (req, res) {
        //req.params.address
        var shares = sharedb.find({
            address: req.params.address,
        }, "added", "desc");

        var allshares = 0, workers = {};
        for (var i in shares) {
            if (!workers[shares[i].worker])
                workers[shares[i].worker] = 0;
            workers[shares[i].worker]++;
            allshares++;
        }

        var stats = [];
        for (var i in workers) {
            stats.push({
                worker: i,
                shares: workers[i],
                persent: (workers[i] / allshares) * 100
            })
        }

        var submits = sharedb.findAndSort({"address": req.params.address}, "added", "desc", 100, 0);

        var unpayed = payoutdb.findAndSort({
            '$and': [
                {address: req.params.address},
                {'payed': {'$ne': 1}}
            ]
        }, "added", "desc", 100, 0);


        var payouts = payoutdb.findAndSort({
            '$and': [
                {address: req.params.address},
                {'payed': {'$eq': 1}}
            ]
        }, "added", "desc", 100, 0);

        var unpcnt = 0, unpamount = 0
        for (var i in unpayed) {
            unpamount += unpayed[i].amount
            unpcnt++;
        }

        var data = {
            unpayed: {
                count: unpcnt,
                amount: unpamount
            },
            address: req.params.address,
            stats: stats,
            submits: submits,
            payouts: payouts,
            title: 'Info about address ' + req.params.address
        };

        if (req.params.format == 'json') {
            res.write(JSON.stringify(data));
        } else
            res.render('worker', data)
    },
    workerDetails: function (req, res) {
        //req.params.address
        //req.params.worker

        var submits = sharedb.findAndSort({'$and': [
                {address: req.params.address},
                {'worker': req.params.worker}
            ]}, "added", "desc", 100, 0);
        var data = {
            worker: req.params.worker,
            address: req.params.address,
            submits: submits,
            title: 'Info about address ' + req.params.address + " and worker " + req.params.worker
        }

        if (req.params.format == 'json') {
            res.write(JSON.stringify(data));
        } else
            res.render('worker_worker', data)
    },
    payout: function () {

    }

}