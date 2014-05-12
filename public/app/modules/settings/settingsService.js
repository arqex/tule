"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'./settingsModels'	
];

define(deps, function($, _, Backbone, SettingsModels){
	var settingsService = {		
		get: function(type){
			return new SettingsModels.getCollection({type: type});
		},

		getCollectionSettings: function(collection){
			return collection.getSettings();
		},

		add: function(){

		},

		save: function(){
			
		}
	};

	return settingsService;
});