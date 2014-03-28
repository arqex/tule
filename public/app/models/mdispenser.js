"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){

var fields = {
	test: ['message']
};

var MDoc = Backbone.Model.extend({
	idAttribute: '_id'
});

var SettingsDoc = MDoc.extend({
	idAttribute: 'name',
	initialize: function(){
		this.isFetched = false;
	},
	fetch: function(opts){
		var me = this;
		return MDoc.prototype.fetch.call(this, opts).then(function(){
			me.isFetched = true;
		});
	},
	url: function() {
		return '/api/settings/'+ this.get('name');
	},
	isNew: function(){
		return !this.isFetched;
	},
	save: function(attrs, opts){
		var me = this;
		return MDoc.prototype.save.call(this, attrs, opts).then(function(){
			me.isFetched = true;
		});
	}
});

var MQuery = Backbone.Collection.extend({
	model: MDoc,
	initialize: function(models, options){
		this.type = options.type;
		this.url = '/api/docs/' + this.type;
	}
});

var MCollection = SettingsDoc.extend({
	initialize: function(attrs, opts){
		this.type = opts.type;
		this.set('name', 'collection_' + opts.type);
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
			this.fetch().always(function(){
				deferred.resolve(me.toJSON());
			});
		return deferred.promise();
	}
});

var MCollectionList = Backbone.Collection.extend({
	model: MCollection,
	url: '/api/collections',
	fetch: function(options) {
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
		return this.find(function(){ return doc.type == type; });
	}
});

var getSettings = function(newName) {
	var deferred = $.Deferred(),
		newSettings = new SettingsDoc({name: newName})
	;

	newSettings.fetch({}).always(function(){
		deferred.resolve(newSettings);
	});

	return deferred.promise();
};

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

	return {
		getMDoc: doc,
		getMCollection: collection,
		getMCollectionList: list,
		SettingsDoc: SettingsDoc,
		getSettings: getSettings
	};
};

	return dispenser();
});