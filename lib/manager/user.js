var user = require('../db/user')
var util = require('../util')

var userManager = function () {

}


userManager.updateLogin = function (address, worker) {
    var u = user.getUser(address);
    if (!u || !u.address)
        u = user.createUser(address);

    u.last_login = new Date().getTime() / 1000;

    console.log("logined user " + u.$loki)
}

userManager.updateSubmit = function (address, worker, reward) {
    var u = user.getUser(address);
    if (!u || !u.address)
        u = user.createUser(address);

    u.last_submit = new Date().getTime() / 1000;

    console.log("submit from user " + u.$loki)
}


userManager.getWorkerName = function (worker) {
    var login = worker, a = login.split("/"), validAddress = util.isValidAddress(a[0]);

    if (!a[1])
        a[1] = 0;

    return {
        worker: a[1],
        address: a[0],
        isValidAddress: validAddress
    }
}



module.exports = userManager;