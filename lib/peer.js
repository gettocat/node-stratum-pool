var net = require('net');
var events = require('events');
var bitPony = require('bitpony')
var util = require('./util.js');
var split = require('split')
var magic = 'ff4c2b1e';

var processData = function (key) {

    var res = processData[key].split(processData.sep);
    if (res.length == 1) {
        //its part of previous message
        return res;
    }

    var result = [], cnt = 0
    for (var i in res) {
        if (i == 0 && res[i] != '') {
            result.push(res[i]);
        } else if (res[i] && res[i].length > 0) {
            var r = processData.sep + res[i];
            result.push(r);
            cnt++;
        }
    }

    processData[key] = "";
    return result;

}

processData.sep = magic
processData['client'] = ""

var decodeMessage = function (buff) {
    

    if (!(buff instanceof Buffer))
        buff = new Buffer(buff, 'hex');

    if (buff.toString('hex').indexOf(magic) != 0) {
        decodeMessage.chunks.push(buff);
        buff = Buffer.concat(decodeMessage.chunks);
        //return false;
    }

    var package = {}, data = null
    var reader = new bitPony.reader(buff);
    var res = reader.uint32(0);

    package.magic = res.result;
    res = reader.uint32(res.offset);
    package.rand = res.result;
    res = reader.uint32(res.offset);
    package.order = res.result;
    res = reader.uint32(res.offset);
    package.messages = res.result;
    res = reader.string(res.offset);
    package.command = res.result.toString('utf8');
    res = reader.hash(res.offset);
    package.checksum = res.result;
    res = reader.string(res.offset);
    package.payload = res.result;

    if (package.messages > 1) {
        if (!decodeMessage.chunks[package.rand])
            decodeMessage.chunks[package.rand] = {};
        decodeMessage.chunks[package.rand][package.order] = package.payload;
        data = null;
        if (Object.keys(decodeMessage.chunks[package.rand]).length >= package.messages) {
            var buffer = Buffer.concat(decodeMessage.chunks[package.rand]);
            data = buffer.toString('utf8');
            decodeMessage.chunks[package.rand] = null;
            delete decodeMessage.chunks[package.rand];
        }
    }

    if (package.messages == 1)
        data = package.payload.toString('utf8');

    if (!data)//multiple message
        return false;

    var myhash = bitPony.tool.sha256(bitPony.tool.sha256(package.command + data)).toString('hex');
    if (myhash != package.checksum) {
        //not full message, wait another chunks
        decodeMessage.chunks = [];
        decodeMessage.chunks[0] = buff;
        console.log("!! cant read message, hash is not valid or size of message is not equals, size (" + package.checksum + "," + myhash + ")")

        return false;
    }

    return [
        package.command,
        data ? JSON.parse(data) : {}
    ]
}
decodeMessage.chunks = [];

var encodeMessage = function (command, payload) {
    var msg = JSON.stringify(payload);
    var buff = new Buffer(magic, 'hex');
    var writer = new bitPony.writer(buff);
    writer.uint32(util.rand(0, 0xffffffff), true)//message round number

    writer.uint32(0, true);//message order in list (used if messages count > 1). Can split big message to some small
    writer.uint32(1, true);//messages count
    //command,
    writer.string(command, true);
    //checksum,
    writer.hash(bitPony.tool.sha256(bitPony.tool.sha256(command + msg)).toString('hex'), true);
    //payload_raw,
    writer.string(msg, true);

    //var bfr = new Buffer(packet_str, 'hex'),
    //sizr = util.littleEndian(bfr.length).toString('hex')
    //console.log("send length "+bfr.length, sizr);
    return writer.getBuffer()
}

var Peer = module.exports = function (options) {

    var _this = this;
    var client;
    magic = options.testnet ? options.coin.peerMagicTestnet : options.coin.peerMagic
    var verack = false;
    var validConnectionConfig = true;

    //https://en.bitcoin.it/wiki/Protocol_specification#Inventory_Vectors
    var invCodes = {
        error: 0,
        tx: 1,
        block: 2
    };

    //If protocol version is new enough, add do not relay transactions flag byte, outlined in BIP37
    //https://github.com/bitcoin/bips/blob/master/bip-0037.mediawiki#extensions-to-existing-messages
    var relayTransactions = options.p2p.disableTransactions === true ? new Buffer([false]) : new Buffer([]);

    var commands = {
        version: 'version',
        inv: 'inv',
        verack: 'verack',
        addr: 'addr',
        getblocks: 'block',
        ping: 'ping',
        pong: 'pong',
    };


    (function init() {
        Connect();
    })();


    function Connect() {

        client = net.connect({
            host: options.p2p.host,
            port: options.p2p.port
        }, function () {
            SendVersion();
        });
        client.on('close', function () {
            if (verack) {
                _this.emit('disconnected');
                verack = false;
                Connect();
            } else if (validConnectionConfig)
                _this.emit('connectionRejected');

        });
        client.on('error', function (e) {
            if (e.code === 'ECONNREFUSED') {
                validConnectionConfig = false;
                _this.emit('connectionFailed');
            } else
                _this.emit('socketError', e);
        });

        var st = client.pipe(split(magic));
        st.on('data', function (data) {
            data = processData.sep + data;
            processData.client += data;
            var res = processData('client');
            for (var i in res) {
                var a = decodeMessage(res[i]);
                if (a)
                    HandleMessage.apply(null, a)
            }
        });

    }




    //Parsing inv message https://en.bitcoin.it/wiki/Protocol_specification#inv
    function HandleInv(payload) {

        if (payload.object_type == 'newblock'){
        _this.emit('blockFound', payload.object_list[0].hash);
        }
        
    }

    function HandleMessage(command, payload) {
        _this.emit('peerMessage', {command: command, payload: payload});
        switch (command) {
            case commands.inv.toString():
                HandleInv(payload);
                break;
            case commands.ping.toString():
                SendMessage(commands.pong, {})
                break;
            case commands.verack.toString():
                if (!verack) {
                    SendMessage(commands.verack, {})
                    verack = true;
                    _this.emit('connected');
                }
                break;
            default:
                break;
        }

    }

    //Message structure defined at: https://en.bitcoin.it/wiki/Protocol_specification#Message_structure
    function SendMessage(command, payload) {
        var msg = encodeMessage(command, payload);
        msg = Buffer.concat([
            msg,
            new Buffer(magic, 'hex')
        ]).toString('hex');
        
        client.write(msg);
        _this.emit('sentMessage', msg);
    }

    function SendVersion() {
        SendMessage(commands.version, {
            version: 5,
            agent: '/node-stratum/',
            agent_version: '0.0.1',
            services: 1, //listener
            relay: false
        });
    }

};

Peer.prototype.__proto__ = events.EventEmitter.prototype;
