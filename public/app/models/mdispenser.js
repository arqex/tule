"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){

var fields = {
	test: ['message']
};

var MDoc = Backbone.Model.extend({
	idAttribute: '_id'
});

var MQuery = Backbone.Collection.extend({
	model: MDoc,
	initialize: function(models, options){
		this.type = options.type;
		this.url = '/api/docs/' + this.type;
	}
});

var MCollection = MDoc.extend({
	idAttribute: 'type',
	initialize: function(attrs, opts){
		this.type = opts.type;
		this.set('type', opts.type);
		this.settingsFetched = false;
	},
	query: function(opts){
		var query = new MQuery([], {type: this.type}),
			deferred = $.Deferred()
		;
		query.fetch({
			data: opts,
			success: function(){
				deferred.resolve(query, opts);
			}
		});
		return deferred.promise();
	},
	getSettings: function(){
		var me = this,
			deferred = $.Deferred()
		;
		if(this.settingsFetched)
			deferred.resolve(this.toJSON());
		else
			this.fetch({success:function(){
				me.settingsFetched = true;
				deferred.resolve(me.toJSON());
			}});

		return deferred.promise();
	},
	url: function() {
		return '/api/collections/' + this.type;
	}
});

var MCollectionList = Backbone.Collection.extend({
	model: MCollection,
	url: '/api/collections',
	fetch: function() {
		var me = this,
			deferred = $.Deferred()
		;
		$.get(this.url, {}, function(data){
			_.each(data, function(collection){
				me.add(new me.model({}, {type: collection}));
			});
			deferred.resolve();
		}, 'json');

		return deferred.promise();
	},
	findByType: function(type){
		return this.find(function(doc){ return doc.type == type; });
	}
});

var dispenser = function(){
	var collections = {},
		doc = function(type){
			var model = new MDoc();
			model.urlRoot = '/api/docs/' + type;
			model.type = type;
			model.fields = fields[type];
			return model;
		},
		collection = function(type){
			if(collections.type)
				return collections.type;

			var collection = new MCollection([], {type: type});
			
			return collection;
		},
		list = function(){
			return new MCollectionList();
		}
	;

	return {getMDoc: doc, getMCollection: collection, getMCollectionList: list};
}


	return dispenser();
});