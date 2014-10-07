'use strict';

var mongo = require('mongodb'),
	when = require('when'),
	_ = require('underscore')
;

var hooks;

var MongoDriver = function(nativeDriver){
	this.db = nativeDriver;
	this.mongo = mongo;
};


MongoDriver.prototype = {
	// Following method to complete Tule DB API
	getCollectionNames: function(callback){
		return this.db.collectionNames(function(err, names){

			var simpleNames = [];
			if(names){
				simpleNames = names.map(function(name){
					return name.name.split('.').slice(1).join('.');
				});
			}
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

var filterResults = function( method, collectionName, clbk, err, results ) {
	hooks.filter( 'document:' + method + ':' + collectionName + ':results', results )
		.then( function( filteredResults ){
			clbk( err, filteredResults );
		})
	;
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

		hooks.filter( 'document:' + method + ':' + collection.collectionName + ':args', args )
			.then( function( fArgs ){
				if( !_.isFunction( fArgs[fArgs.length - 1] ) || method == 'find' )
					return mongo.Collection.prototype[method].apply(collection, fArgs);

				// Replace original calback by the filtered one
				var clbk = fArgs[fArgs.length - 1];
				fArgs[fArgs.length - 1] = filterResults.bind(null, method, collection.collectionName, clbk);

				// Call the method with the new callback
				return mongo.Collection.prototype[method].apply(collection, fArgs);
			})
		;
	},

	deepToObjectID = function(query){
		var keys = Object.getOwnPropertyNames(query),
			value
		;
		keys.forEach(function(key){
			if(key == '_id' && typeof query._id == 'string' && query._id.match(/^[a-f0-9]{24}$/i) ){
				query._id = new mongo.ObjectID(query._id);
			}
			else if ( Object.prototype.toString.call( query[key] ) === '[object Array]') {
				for (var i = 0; i < query[key].length; i++) {
					value = query[key][i];
					if( typeof value == 'string' && value.match(/^[a-f0-9]{24}$/i) ){
						query[key][i] = new mongo.ObjectID( value );
					}
					else if (value && typeof value == 'object')
						query[key][i] = deepToObjectID( query[key][i] );
				}
			}
			else if (query[key] && typeof query[key] == 'object')
				query[key] = deepToObjectID(query[key]);
		});
		return query;
	}
;


var TuleCollection = {
	find: function(){
		var me = this,
			index = callbackIndex(arguments),
			original = arguments[index]
		;

		if(index == -1){
			return mongo.Collection.prototype.find.apply(this, arguments);
		}

		arguments[index] = function(err, cursor){
			if(err)
				return original(err, cursor);

			cursor.toArray(function(err, results){
				filterResults( 'find', me.collectionName, original, err, results);
			});
		};

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


module.exports = {
	init: function(options, hooksObject){
		var me = this,
			deferred = when.defer()
		;

		//define the hooks object
		hooks = hooksObject;

		mongo.MongoClient.connect(options.url, function(err, db){
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