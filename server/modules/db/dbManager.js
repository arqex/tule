var when = require('when'),
	_ = require('underscore'),
	config = require('config'),
	hooks = require(config.path.modules + '/hooks/hooksManager')
;


var app, driverInstance;

module.exports = {
	defaultDriver: __dirname + '/mongoDriver.js',
	init: function(appObject){
		var me = this,
			deferred = when.defer()
		;
		app = appObject;
		console.log("Init Driver");
		hooks.filter('db:driverpath', this.defaultDriver).then(function(driverPath){
			me.initDriver(driverPath).then(
				function(driver){
					console.log("Driver resolved");
					deferred.resolve(driver);
				},
				function(error){
					deferred.reject(error);
				}
			);
		});
		return deferred.promise;
	},
	initDriver: function(driverFile){
		var deferred = when.defer(),
			driver = require(driverFile),
			promise = driver.init()
		;

		if(!_.isObject(promise) || !_.isFunction(promise.then)){
			console.log('Driver error');
			deferred.reject('DB driver is not compatible with Tule');
			return deferred.promise;
		}

		console.log('Waiting by the driver');

		promise.then(function(db){
			driverInstance = db;
			console.log('Driver received');
		}, function(err){
			throw err;
		});

		return promise;
	},
	getInstance: function(){
		console.log('Requesting instance');
		return driverInstance;
	}
}