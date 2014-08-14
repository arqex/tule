var when = require('when'),
	_ = require('underscore'),
	config = require('config')
;


var app, driverInstance, hooks;

module.exports = {
	defaultDriver: __dirname + '/mongoDriver.js',
	init: function(appObject){
		var me = this,
			deferred = when.defer()
		;
		app = appObject;
		hooks = app.hooks;
		console.log("Init Driver");
		hooks.filter('db:driverpath', this.defaultDriver).then(function(driverPath){
			me.initDriver(driverPath).then(
				function(driver){
					console.log("Driver resolved");
					deferred.resolve(driver);
					//me.checkSettings();
					hooks.trigger('db:ready');
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
	},
	checkSettings: function(){

		console.log('Checking settings');
		driverInstance.collection(config.tule.settingsCollection).find({}, function(err, settings){
			if(err || settings.length === 0){
				console.log("Database doesn't exists. Creating an empty new one.");
				driverInstance.collection(config.tule.settingsCollection).insert([
					{
						name: 'navData',
						routes: [
							{text: 'Collection', url: '/collection/list/test'},
							{text: 'Settings', url: '/settings/general', subItems: [
								{text: 'General', url: '/settings/general'},
								{text: 'Navigation', url: '/settings/navigation'},
								{text: 'Collections', url: '/settings/collections'}
							]}
						]
					},
					{
						name: 'globals',
						settingsCollection: 'monSettings',
						datatypes: ['string', 'array', 'boolean', 'float', 'integer', 'object', 'field', 'select'],
						datatypesPath: 'modules/datatypes/'
					}
				], function(err, clbk){
					if(err)
						console.log("Error creating new settings.");
					else
						console.log("New settings setted correctly.");
				});
			}
		});
	}
}
