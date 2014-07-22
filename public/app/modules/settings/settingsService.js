var deps = [
	'jquery', 'underscore', 'backbone', './settingsModels'
];

define(deps, function($, _, Backbone, Models){
	"use strict";

	var SettingsService = function(){

	}

	SettingsService.prototype = {
		/**
		 * Fetch a setting from the server
		 * @param  {String} name Setting name
		 * @return {Setting}     A Setting object
		 */
		get: function(name){
			var deferred = $.Deferred(),
				setting = new Models.Setting({name: name})
			;

			setting.fetch({
				success: function(){
					deferred.resolve(setting);
				},
				error: function(model, response){
					deferred.reject(response.responseText);
				}
			});

			deferred.promise();
		},

		/**
		 * Get a new Setting object
		 * @param  {String} name Setting's name
		 * @return {Setting}      A new Setting object (not stored)
		 */
		getNew: function(name){
			return new Models.Setting({name: name});
		},

		/**
		 * Store the setting in the server
		 * @param  {Setting} setting A setting object
		 * @return {Promise}         A promise that resolves when the server has stored the setting.
		 *                           On fail, the promise will be rejected with the message provided
		 *                           by the server as argument.
		 */
		save: function(setting){
			var deferred = $.Deferred();
			setting.save(null, {
				success: function(){
					deferred.resolve(setting);
				},
				error: function(model, response) {
					deferred.reject(response.responseText)
				}
			});
			return deferred.promise();
		},

		/**
		 * Get the collection settings given the collection name
		 * @param  {String} collectionName Collection name
		 * @return {Promise}     A promise that resolves with the CollectionSetting object, when
		 *                         it has been fetched from the server.
		 *                         On fail, the promise will be rejected with the message provided
		 *                         by the server as argument.		 *
		 */
		getCollectionSettings: function(collectionName) {
			var deferred = $.Deferred(),
				setting = new Models.CollectionSettings({}, {collectionName: collectionName})
			;

			setting.fetch({
				success: function(){
					deferred.resolve(setting);
				},
				error: function(model, response){
					deferred.reject(response.responseText);
				}
			});

			return deferred.promise();
		},

		getNewCollectionSettings: function(collectionName) {
			return new Models.CollectionSettings({}, {collectionName: collectionName});
		}
	}

	return new SettingsService();
});
