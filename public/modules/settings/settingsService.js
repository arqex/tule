var deps = [
	'jquery', 'underscore', 'backbone', './settingsModels', 'events'
];

define(deps, function($, _, Backbone, Models, Events){
	'use strict';

	var SettingsService = function(){};

	SettingsService.prototype = {

		/**
		 * Fetch a setting from the server
		 * @param  {String} name Setting name
		 * @return {Setting}     A Setting object
		 */
		get: function(settingName){
			var deferred = $.Deferred(),
				setting = new Models.Setting({name: settingName})
			;

			setting.fetch({
				success: function(){
					var settingObject = setting.toJSON();

					// _id shouldn't be needed
					delete settingObject._id;

					deferred.resolve(settingObject);
				},
				error: function(model, response){
					deferred.reject(response.responseText);
				}
			});

			return deferred.promise();
		},

		/**
		 * Store the setting in the server
		 * @param  {Setting} setting A setting object
		 * @return {Promise}         A promise that resolves when the server has stored the setting.
		 *                           On fail, the promise will be rejected with the message provided
		 *                           by the server as argument.
		 */
		save: function(settingName, settingValue){
			var deferred = $.Deferred(),
				settingObject = {name: settingName, value: settingValue},
				setting = new Models.Setting(settingObject)
			;

			setting.save(null, {
				success: function(){
					deferred.resolve(settingObject);
					Events.trigger('setting:updated:' + settingName, settingValue);
				},
				error: function(model, response) {
					deferred.reject(response.responseText);
				}
			});

			return deferred.promise();
		},

		/**
		 * Deletes a setting from the server given its name.
		 *
		 * @param  {String} settingName Setting's name.
		 * @return {Promise}            A promise that resolves when the server has deleted the setting.
		 */
		remove: function(settingName) {
			var deferred = $.Deferred(),
				setting = new Models.Setting({name: settingName})
			;

			setting.destroy({
				success: function(){
					deferred.resolve();
					Events.trigger('setting:deleted:' + settingName);
				},
				error: function(err) {
					deferred.reject(err);
				}
			});

			return deferred.promise();
		}
	};

	return new SettingsService();
});
