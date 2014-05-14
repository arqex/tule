"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'./settingsModels'	
];

define(deps, function($, _, Backbone, SettingsModels){
	var settingsService = {		
		get: function(type){
			var query = new SettingsModels.getCollection([], {type: type}),
				deferred = $.Deferred(),
				me = this
			;

			query.fetch({				
				success: function(){
					deferred.resolve(query);
				}
			});

			return deferred.promise();
		},

		getNew: function(type){
			return new SettingsModels.getCollection({}, {type: type});
		},

		getCollectionSettings: function(collection){
			return collection.getSettings();
		},

		save: function(collection){
			var deferred = $.Deferred();
			collection.save(null, {success: function(){
				return deferred.resolve();
			}});
			return deferred.promise();
		}
	};

	return settingsService;
});