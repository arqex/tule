"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){

var fields = {
	test: ['message']
};

var Doc = Backbone.Model.extend({
	idAttribute: '_id'
});

var SettingsDoc = Doc.extend({
	idAttribute: 'name',
	initialize: function(){
		this.isFetched = false;
	},
	fetch: function(opts){
		var me = this;
		return Doc.prototype.fetch.call(this, opts).then(function(){
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
		return Doc.prototype.save.call(this, attrs, opts).then(function(){
			me.isFetched = true;
		});
	}
});

var DocCollection = Backbone.Collection.extend({
	model: Doc,
	initialize: function(models, options){
		this.type = options.type;
	}
});

var Query = Backbone.Model.extend({
	initialize: function(attrs, options){
		this.type = options.type;
		this.url = '/api/docs/' + this.type;
	}
});

var Collection = SettingsDoc.extend({
	initialize: function(attrs, opts){
		this.type = opts.type;
		this.set('name', 'collection_' + opts.type);
		this.settingsFetched = false;
	},
	query: function(opts){
		var query = new Query([], {type: this.type}),
			deferred = $.Deferred(),
			me = this
		;
		query.fetch({
			data: opts,
			success: function(){
				query.set('documents', new DocCollection(query.get('documents'), {type: me.type})); 
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

var CollectionList = Backbone.Collection.extend({
	model: Collection,
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
			var model = new Doc();
			model.urlRoot = '/api/docs/' + type;
			model.type = type;
			model.fields = fields[type];
			return model;
		},
		collection = function(type){
			if(collections.type)
				return collections.type;

			var collection = new Collection([], {type: type});

			return collection;
		},
		list = function(){
			return new CollectionList();
		}
	;

	return {
		getDoc: doc,
		getCollection: collection,
		getCollectionList: list,
		SettingsDoc: SettingsDoc,
		getSettings: getSettings
	};
};

	return dispenser();
});