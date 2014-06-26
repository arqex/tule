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
		/**
			Fetch a document given its id
		*/
		get: function(id){
			var query = new CollectionModels.Query([], {objectID: id, type: this.type}),
				deferred = $.Deferred(),
				me = this
			;

			query.fetch({
				data: id,
				success: function(){
					deferred.resolve(query, id);
				},
				error: function(error){
					deferred.reject(error);
				}
			});

			return deferred.promise();
		},

		/** Get a blank document of the given type */
		getNew: function(type){
			return new CollectionModels.Document({}, {type: type});
		},

		/** Find a collection of documents which match a given query .
			TODO: Explain find object
		*/
		find: function(query){
			query = query || {};
			var collection = new SettingsModels.SettingsCollection({}, {name: this.type});
			return collection.query(query);
		},

		/**
			Save a given document
		*/
		save: function(doc){
			var deferred = $.Deferred();
			doc.save(null, {success: function(){
				return deferred.resolve(doc);
			}});
			return deferred.promise();
		}
	};

	var collections = {
		collection: function(type){
			return new CollectionService(type);
		},

		getCollectionList: function(){
			var	deferred = $.Deferred();

			$.get('/api/collections', {}, function(data){
				deferred.resolve(data);
			}, 'json');

			return deferred.promise();
		}
	};

	return collections;
});