var when = require('when'),
	_ = require('underscore')
;


var app, driverInstance;

module.exports = {
	defaultDriver: __dirname + '/mongoDriver.js',
	init: function(appObject){
		var me = this,
			deferred = when.defer()
		;
		app = appObject;
		app.managers.plugins.triggerFilter('db:driverpath', this.defaultDriver).then(function(driverPath){
			me.initDriver(driverPath).then(
				function(driver){
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

		if(!_.isObject(promise) || _.isFunction(promise.then)){
			deferred.reject('DB driver is not compatible with Tule');
			return deferred.promise;
		}
		promise.then(function(driver){
			driverInstance = driver;
		});

		driverInstance = promise;
		return promise;
	},
	getInstance: function(){
		return driverInstance;
	}
}