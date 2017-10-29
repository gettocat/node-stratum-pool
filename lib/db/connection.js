var loki = require('lokijs');
var db = {};

module.exports = function (path) {

    var connection = function (dbname) {
        this.dbname = dbname ? dbname : 'db';
        this.inmemory = false;
        this.indexes = false;
    }

    connection.prototype = {
        create: function (inmemory, forindexes) {
            this.inmemory = inmemory;
            this.indexes = forindexes;
            var f = this;
            return new Promise(function (resolve, reject) {
                if (!db[f.dbname]) {

                    if (f.inmemory) {
                        var opts = {};
                    } else
                        var opts = {
                            autoload: true,
                            autoloadCallback: databaseInitialize,
                            autosave: true,
                            autosaveInterval: 100
                        };

                    if (f.inmemory) {
                        var mem = new loki.LokiMemoryAdapter();
                        opts.adapter = mem;
                    }

                    db[f.dbname] = new loki(path + '/' + f.dbname, opts);
                    if (f.inmemory)
                        databaseInitialize()

                    function databaseInitialize() {
                        
                        db[f.dbname].gc = function (name) {
                            var coll = db[f.dbname].getCollection(name);
                            if (coll === null) {
                                coll = db[f.dbname].addCollection(name, {clone: false});//its mean that object save changes to db onfly
                            }

                            return coll;
                        }

                        resolve(db[f.dbname]);
                    }

                } else
                    resolve(db[f.dbname]);
            });
        },
        get: function () {
            return db[this.dbname];
        }
    }

    return connection;

}