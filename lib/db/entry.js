var dbconnection = require('./connection')(__dirname + "/../../");

var dbentry = function (collection, options) {
    this.name = collection;
    if (options)
        this.options = options;
}

dbentry.prototype = {
    dbname: 'pool.db',
    class: null,
    db: null,
    context: null,
    init: function () {

        if (!this.db) {
            var dbconn = new dbconnection(this.dbname);
            var db = dbconn.get()
            this.db = db;
        }


    },
    set: function (key, value) {
        var obj = this.getDB().gc(this.name).findOne({'key': key});
        if (obj && obj.value) {
            obj.value = value
            this.getDB().gc(this.name).update(obj);
        } else {
            obj1 = {key: key, value: value};
            obj = this.getDB().gc(this.name).insert(obj1);
        }

        this.save();
        return obj;

    },
    get: function (key) {
        var val = this.getDB().gc(this.name).findOne({'key': key});
        if (!val || !val.value)
            val = {};
        else
            val = val.value;

        return val;
    },
    find: function (fields) {
        var val = this.getDB().gc(this.name).find(fields);
        return val;
    },
    findAndSort: function (fields, sortKey, sortVal, limit, offset) {
        if (!sortVal)
            sortVal = 'asc';

        var val = this.getDB().gc(this.name).chain().find(fields).simplesort(sortKey, sortVal != 'asc').limit(limit||100).offset(offset||0)
        return val.data();
    },
    remove: function (key) {
        var val = this.getDB().gc(this.name).findOne({'key': key});
        if (val)
            this.getDB().gc(this.name).remove(val);

        return !!val;
    },
    insert: function (data) {
        if (data.id) {
            return this.update(data);
        } else {
            return this.getDB().gc(this.name).insert(data);
        }
        return this.getDB().gc(this.name).insert(data);
    },
    update: function (data) {
        var val = this.getDB().gc(this.name).findOne({'id': data.id});
        if (val && val.id) {
            var lid = val.$loki;
            val = data;
            val.$loki = lid;
            return this.getDB().gc(this.name).update(data);
        } else {
            return this.getDB().gc(this.name).insert(data);
        }
    },
    count: function () {
        return this.getDB().gc(this.name).count();
    },
    getCollection: function () {
        return this.getDB().gc(this.name);
    },
    getDB: function () {
        if (!this.db)
            this.init();
        return this.db
    },
    save: function () {
        return this.getDB().saveDatabase();
    },
}

module.exports = dbentry;