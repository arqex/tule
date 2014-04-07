var nedb = require('nedb'),
	when = require('when'),
	promisify = require('when/node/function'),
	config = require('config'),
	fs = require('fs')
;

var collections

var NedbDriver = function(){},
	TuleCollection = function(collectionName){
		this.collectionName = collectionName;
		this.db = new nedb({filename: config.nedb.dataPath + '/' + collectionName + '.db', autoload: true});
	}
;

NedbDriver.prototype = {
	collection: function(collectionName){
		return new TuleCollection(collectionName);
	},
	createCollection: function(collectionName, callback){
		callback(null, new TuleCollection(collectionName));
	},
	getCollectionNames: function(callback){
		var collectionNames = [];
		fs.readdir(config.nedb.dataPath, function(err, files){
			if(err)
				return callback(err);

			files.forEach(function(file){
				if(file.length > 3 && file.substring(file.length - 3, 3) == '.db')
					collectionNames.push(file.substring(0, file.length - 3));
			});

			callback(null, collectionNames);
		});
	},
	renameCollection: function(oldName, newName, callback){
		var oldPath = config.nedb.dataPath + '/' + oldName + '.db',
			newPath = config.nedb.dataPath + '/' + newName + '.db'
		;
		fs.rename(oldPath, newPath, function(err){
			callback(err, newName);
		});
	},
	dropCollection: function(collectionName, callback){
		fs.unlink(config.nedb.dataPath + '/' + collectionName + '.db', callback);
	}
};

TuleCollection.prototype = {
	find: function(query, options, callback){
		var q = query || {},
			o = false,
			c = false
		;

		if(typeof options == 'function')
			c = options;
		else{
			o = options;
			c = callback;
		}

		var find = this.db.find(q);
		if(o){
			if(o.sort)
				find.sort(o.sort);
			if(o.skip)
				find.skip(o.skip);
			if(o.limit)
				find.limit(o.limit);
		}
		find.exec(c);
	},
	findOne: function(query, options, callback){
		var q = query || {},
			o = {},
			c = false
		;

		if(typeof options == 'function')
			c = options;
		else{
			o = options;
			c = callback;
		}

		o.limit = 1;
		this.find(q, o, function(err, docs){
			if(err)
				return c(err);
			if(docs.length)
				return c(null, docs[0]);
			return c(null, false);
		});
	},

	insert: function(docs, callback){
		this.db.insert(docs, callback);
	},
	update: function(criteria, update, options, callback){

	},
	save: function(docs, callback){

	},
	remove: function(docs, callback){

	},
	count: function(callback){

	}
}

module.exports = {
	init: function(){
		return when.resolve(new NedbDriver());
	}
}
