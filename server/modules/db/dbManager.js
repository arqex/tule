'use strict';

var when = require('when'),
	_ = require('underscore'),
	config = require('config'),
	log = require('winston')
;

var app, hooks, dbInstance, settingsInstance;

module.exports = {
	defaultDriver: __dirname + '/mongoDriver.js',
	init: function(appObject){
		var me = this,
			deferred = when.defer()
		;
		app = appObject;
		hooks = app.hooks;

		// Plugins can install new db drivers, but the activation of them is
		// made by setting them up in the config file.
		hooks.filter('db:drivers', {mongo: this.defaultDriver}).then(function(drivers){
			var dbDriver = config.db.driver,
				dbDriverPath = drivers[dbDriver],
				tuleDriver = config.tule.db.driver,
				tuleDriverPath = drivers[tuleDriver],
				dbPromise, tulePromise
			;

			if(!tuleDriverPath || !tuleDriverPath)
				return deferred.reject('Unknown driver: ' + dbDriver + ', ' + tuleDriver);

			// There are two instances that may be different, collections and settings db.
			// The options in the config are passed as arguments for driver initialization.
			dbPromise = me.initDriver(dbDriverPath, config.db.options);
			tulePromise = me.initDriver(tuleDriverPath, config.tule.db.options);

			when.join(dbPromise, tulePromise)
				.then(function(drivers){
					dbInstance = drivers[0];
					settingsInstance = drivers[1];
					deferred.resolve(drivers);
					hooks.trigger('db:ready');
				})
				.catch(function(err){
					deferred.reject(err);
				})
			;
		});

		// Register this module and qdb
		config.register( 'db', __dirname + '/dbManager' );
		config.register( 'qdb', __dirname + '/qdb' );

		return deferred.promise;
	},

	/**
	 * Inits a db driver.
	 *
	 * @param  {String} driverFile The path to the js file that export the driver
	 * @param  {Object} options    Options for initializating the driver.
	 * @return {Promise} To be resolved with the driver when it is ready.
	 */
	initDriver: function(driverFile, options){
		var deferred = when.defer(),
			driver = require(driverFile),
			promise = driver.init(options, app.reqHooks)
		;


		if(!_.isObject(promise) || !_.isFunction(promise.then)){
			var errorMsg = 'DB driver is not compatible with Tule';
			log.error('Driver error', {error: errorMsg});
			deferred.reject(errorMsg);
			return deferred.promise;
		}

		log.info('Waiting by the driver');

		return promise;
	},

	/**
	 * Get a DB instance.
	 * @param  {String} type If equals to 'settings' the settings db instance will be
	 *                       returned. Otherwise the collections instance.
	 * @return {DBDriver} The requested db driver instance.
	 */
	getInstance: function(type){
		log.debug('Requesting db instance ' + (type || 'collections'));

		if(type == 'settings')
			return settingsInstance;

		return dbInstance;
	}
};
