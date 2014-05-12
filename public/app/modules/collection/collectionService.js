"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'./collectionModels', '../settings/settingsModels'
];

define(deps, function($, _, Backbone, CollectionModels, SettingsModels){
	var collectionService = {		
		get: function(type){
			return new CollectionModels.getDocument({type: type});
		},

		find: function(collection, query){
			return collection.query(query);
		},

		add: function(){

		},

		save: function(){
			
		}
	};

	var collections = {
		collection: function(type){
			collectionService.type = type;
			return collectionService;
		}
	};

	return collections;
});