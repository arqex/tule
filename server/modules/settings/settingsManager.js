'use strict';

var config = require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	when = require('when')
;

console.log(config.tule.settingsCollection);

var settings = db.collection(config.tule.settingsCollection),
	staticSettings = {},
	hooks
;

/**
 * Applies filters to the settings value returned by the get and getPublic methods.
 *
 *
 * @param  {String} settingName  The name of the setting
 * @param  {Mixed} settingValue Initial value to filter.
 * @param  {Deferred} deferred     The deferred object of the get or getPublic mehod.
 * @return {undefined}
 */
var filter = function(settingName, settingValue, deferred) {
	hooks.filter('settings:get:' + settingName, settingValue)
		.then(function(filtered){
			deferred.resolve(filtered);
		})
	;
};

/**
 * The settings manager make easy to handle settings in tule.
 * Tule has two different kinds of settings:
 * 	* Database settings: The standard ones. They are stored in the DB and
 * 		it is the best way for tule and its plugins to store data permanently.
 * 	* Static settings: They are defined in runtime and it is not possible to update or delete
 * 		them. They are stored in memory instead of in the database, and are very useful to not
 * 		let the plugins modify core settings of tule.
 *
 *	The settings can be filtered when fetched using the filter 'setting:get:{settingName}'.
 */
module.exports = {
	init: function(appObject) {
		hooks = appObject.hooks;
	},

	/**
	 * Get a stored setting by its name.
	 *
	 * @param  {String} settingName The setting name.
	 * @return {Promise}             To be resolved when the setting is ready. If the setting is not
	 *                                  defined, undefined is returned to the callback.
	 */
	get: function(settingName){
		var deferred = when.defer(),
			staticSetting
		;

		if(staticSetting = staticSettings[settingName]){
			filter(settingName, staticSetting.value, deferred);
		}
		else {
			settings.findOne({name: settingName}, function(err, setting){
				if(err)
					deferred.reject(err);
				else if(setting)
					filter(settingName, setting.value, deferred);
				else
					filter(settingName, undefined, deferred);
			});
		}

		return deferred.promise;
	},

	/**
	 * Get a stored setting by its name, only if it is defined as public.
	 * This function is used by the settings api, to make the settings available by the rest
	 * service only if they are public.
	 *
	 * @param  {String} settingName The setting name.
	 * @return {Promise}             To be resolved when the setting is ready. If the setting is not
	 *                                  defined, undefined is returned to the callback.
	 *                                  If the setting is not public, the promise will be rejected.
	 */
	getPublic: function(settingName){
		var deferred = when.defer(),
			staticSetting
		;

		if(staticSetting = staticSettings[settingName]){
			if(!staticSetting.isPublic)
				deferred.reject({error: 'private', message: 'Private setting.'});
			else
				filter(settingName, staticSetting.value, deferred);
		}
		else{
			settings.findOne({name: settingName}, function(err, setting){
				if(err)
					deferred.reject(err);
				else if(setting && !setting.isPublic)
					deferred.reject({error: 'private', message: 'Private setting.'});
				else if(setting)
					filter(settingName, setting.value, deferred);
				else
					filter(settingName, undefined, deferred);
			});
		}

		return deferred.promise;
	},

	/**
	 * Creates or updates the setting in the database.
	 * @param  {String}  settingName  The setting name.
	 * @param  {Mixed}  settingValue The new setting value.
	 * @param  {Boolean} isPublic    Whether the setting is public.
	 * @return {Promise}             A promise to be resolved when the setting is saved. The
	 *                                 setting value is returned on success.
	 *                                 If the setting was already created as static, the promise
	 *                                 will be rejected.
	 */
	save: function(settingName, settingValue, isPublic){
		var deferred = when.defer(),
			val = {'$set': {value: settingValue, name: settingName}}
		;

		if(typeof staticSettings[settingName] != 'undefined') {
			deferred.reject({error: 'static', message:' Can\'t update a static setting'});
		}
		else {
			if(typeof isPublic != 'undefined')
				val['$set'].isPublic = !!isPublic;

			settings.update({name: settingName}, val, {upsert:true}, function(err){
				if(err)
					deferred.reject(err);
				else {
					hooks.trigger('settings:saved:' + settingName, settingValue);
					deferred.resolve(settingValue);
				}
			});
		}

		return deferred.promise;
	},

	/**
	 * Deletes the setting in the database.
	 *
	 * @param  {String}  settingName  The setting name.
	 * @return {Promise}             A promise to be resolved when the setting is deleted.
	 *                                 If the setting was already created as static, the promise
	 *                                 will be rejected.
	 */
	remove: function(settingName) {
		var deferred = when.defer();

		if(typeof staticSettings[settingName] != 'undefined') {
			deferred.reject('Can\'t delete a static setting');
		}
		else {
			settings.remove({name: settingName}, function(err){
				if(err)
					deferred.reject(err);
				else
					deferred.resolve();
			});
		}

		return deferred.promise;
	},

	/**
	 * Set a setting as static.
	 * Static settings can not be edited or deleted. But plugins can modify their value on the
	 * fly using the filter 'settings:get:{settingName}'.
	 *
	 * @param  {String}  settingName  The setting name.
	 * @param  {Mixed}  settingValue The new setting value.
	 * @param  {Boolean} isPublic    Whether the setting is public.
	 * @return {Mixed} The setting referenced, so it can be modify by the code that created the setting.
	 *                     If the setting is already defined. false is returned.
	 */
	setStatic: function(settingName, settingValue, isPublic) {
		if(typeof staticSettings[settingName] != 'undefined')
			return false;

		var setting = {
			value: settingValue,
			isPublic: !!isPublic
		};

		staticSettings[settingName] = setting;

		// Return the reference, last chance of updating the setting.
		return setting;
	}
};