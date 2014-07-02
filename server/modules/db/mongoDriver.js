var mongo = require('mongodb'),
	config = require('config'),
	when = require('when'),
	_ = require('underscore')
;

var MongoDriver = function(nativeDriver){
	this.db = nativeDriver;
	this.mongo = mongo;
};


MongoDriver.prototype = {
	// Following method to complete Tule DB API
	getCollectionNames: function(callback){
		return this.db.collectionNames(function(err, names){
			// WTF: Mongo native driver includes the db name: dbName.collectionName. Remove it!
			var simpleNames = names ? names.map(function(name){return name.name.split('.').slice(1).join('.');}) : [];
			callback(err, simpleNames);
		});
	},

	// collection method to let the find methods return an array of results
	collection: function(){
		var index = callbackIndex(arguments),
			original
		;

		if(index != -1){
			original = arguments[index];
			arguments[index] = function(err, collection){
				if(collection)
					_.extend(collection, TuleCollection);
				original(err, collection);
			};
			return null;
		}

		return _.extend(this.db.collection.apply(this.db, arguments), TuleCollection);
	},

	createCollection: function(){
		return this.db.createCollection.apply(this.db, arguments);
	},

	renameCollection: function(){
		return this.db.renameCollection.apply(this.db, arguments);
	},

	dropCollection: function(){
		return this.db.dropCollection.apply(this.db, arguments);
	}

};

var callbackIndex = function(args){
		var i = -1;

		while(++i<args.length)
			if(typeof args[i] === 'function')
				return i;
		return -1;
	},

	toObjectID = function(collection, method, args){
		if(args[0])
			args[0] = deepToObjectID(args[0]);
		return mongo.Collection.prototype[method].apply(collection, args);
	},

	deepToObjectID = function(query){
		var keys = Object.getOwnPropertyNames(query);
		keys.forEach(function(key){
			if(key == '_id' && typeof query._id == 'string' && query._id.length == 24){
				query._id = new mongo.ObjectID(query._id);
			}
			else if (typeof query[key] == 'object')
				query[key] = deepToObjectID(query[key]);
		});
		return query;
	}
;


var TuleCollection = {
	find: function(){
		var index = callbackIndex(arguments),
			original = arguments[index]
		;

		if(index == -1){
			return mongo.Collection.prototype.find.apply(this, arguments);
		}

		arguments[index] = function(err, cursor){
			if(err)
				return original(err, cursor);
			cursor.toArray(function(err, results){
				original(err, results);
			});
		}
		return toObjectID(this, 'find', arguments);
	},

	findOne: function(){
		return toObjectID(this, 'findOne', arguments);
	},

	//insert is the same as the navive one.

	update: function(){
		return toObjectID(this, 'update', arguments);
	},

	save: function(){
		return toObjectID(this, 'save', arguments);
	},

	remove: function(){
		return toObjectID(this, 'remove', arguments);
	},

	count: function(){
		if(typeof arguments[0] == 'function')
			return mongo.Collection.prototype.count.apply(this, arguments);
		return toObjectID(this, 'count', arguments);
	}
};



var driver;

module.exports = {
	init: function(){
		var me = this,
			deferred = when.defer()
		;
		console.log(config);
		mongo.MongoClient.connect(config.mongo, function(err, db){
			if(err)
				deferred.reject(err);
			else {
				var driver = new MongoDriver(db);
				deferred.resolve(driver);
			}
		});
		return deferred.promise;

	}
};