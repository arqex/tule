"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'./collectionModels', '../settings/settingsModels'
];

define(deps, function($, _, Backbone, CollectionModels, SettingsModels){
	var CollectionService = function(type){
		this.type = type;
	};

	CollectionService.prototype = {		
		get: function(type){
			return new CollectionModels.getDocument({type: type});
		},

		find: function(query){
			var collection = new SettingsModels.getCollection({type: this.type});
			return collection.query(query);
		},

		add: function(){

		},

		save: function(){
			
		}
	};

	var collections = {
		collection: function(type){
			return new CollectionService(type);
		}
	};

	return collections;
});