var client = require('mongodb').MongoClient,
	config = require('config'),
	when = require('when'),
	_ = require('underscore')
;

var MongoDriver = function(){};

MongoDriver.prototype.init = function(){
	var deferred = when.defer();
	client.connect(config.mongo, function(err, db){
		if(err)
			return deferred.reject(err);
		_.extend(this, db);
		return deferred.resolve(this);
	});
	return deferred.promise;
};

var driver = new MongoDriver();
module.exports = driver;