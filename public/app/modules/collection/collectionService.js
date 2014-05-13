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
		get: function(opts){
			var query = new CollectionModels.getQuery([], {type: this.type}),
				deferred = $.Deferred(),
				me = this
			;

			query.fetch({
				data: opts,
				success: function(){
					deferred.resolve(query, opts);
				}
			});

			return deferred.promise();
		},

		getNew: function(type){
			return new CollectionModels.getDocument({type: type});
		},

		find: function(query){
			query = query || {};
			var collection = new SettingsModels.getCollection({type: this.type});
			return collection.query(query);
		},

		save: function(doc){
			var deferred = $.Deferred();
			doc.save(null, {success: function(){
				return deferred.resolve();
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
				_.each(data, function(collection){
					me.add(new me.model({}, {type: collection}));
				});
				deferred.resolve();
			}, 'json');

			return deferred.promise();
		}
	};

	return collections;
});