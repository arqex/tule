"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){
	var collectionService = {		
		get: function(id){

		},

		find: function(query){

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