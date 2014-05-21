"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'./settingsModels'
];

define(deps, function($, _, Backbone, SettingsModels){
	var settingsService = {

		/** Fetch an existing settings document */
		get: function(name){
			var settings 	= new SettingsModels.SettingsCollection({}, {name: name}),
				deferred 	= $.Deferred()
			;

			settings.fetch({
				success: function(){
					deferred.resolve(settings);
				}
			});

			return deferred.promise();
		},

		/** Get a blank settings document */
		getNew: function(name){
			return new SettingsModels.Settings({name: name});
		},

		getNewCollection: function(name){
			return new SettingsModels.SettingsCollection({}, {name: name});
		},

		/** Fetch the collection settings from its name */
		getCollectionSettings: function(name){
			var collectionSettings = new SettingsModels.SettingsCollection({}, {name: name});
			return collectionSettings.getSettings();
		},

		/** Save the settings */
		save: function(settings){
			var deferred = $.Deferred();
			settings.save(null, {success: function(){
				return deferred.resolve();
			}});
			return deferred.promise();
		}
	};

	return settingsService;
});