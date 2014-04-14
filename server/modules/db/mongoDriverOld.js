var mongo = require('mongodb'),
	config = require('config'),
	when = require('when'),
	_ = require('underscore')
;

var MongoDriver = function(){};


MongoDriver.prototype = {
	init: function(){
		var me = this,
			deferred = when.defer()
		;
		console.log(config);
		mongo.MongoClient.connect(config.mongo, function(err, db){
			if(err)
				deferred.reject(err);
			else {
				_.extend(db, me);
				console.log(me.getCollectionNames);
				console.log('Driver working ok');
				console.log(me.getCollectionNames);
				deferred.resolve(db);
			}
		});
		return deferred.promise;
	},

	// Following method to complete Tule DB API
	getCollectionNames: function(callback){
		return this.collectionNames(function(err, names){
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

		return _.extend(mongo.Db.prototype.collection.apply(this, arguments), TuleCollection);
	}

};

var callbackIndex = function(args){
	var i = -1;

	while(++i<args.length)
		if(typeof args[i] === 'function')
			return i;
	return -1;
};

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

		return mongo.Collection.prototype.find.apply(this, arguments);
	}
};



var driver = new MongoDriver();
module.exports = driver;