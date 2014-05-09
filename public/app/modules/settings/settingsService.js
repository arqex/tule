"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){
	var settingsService = {		
		get: function(id){

		},

		find: function(query){

		},

		add: function(){

		},

		save: function(){
			
		}
	};

	var settings = {
		setting: function(type){
			collectionService.type = type;
			return collectionService;
		}
	};

	return settings;
});