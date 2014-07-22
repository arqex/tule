define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){

	"use strict";

	var Setting = Backbone.Model.extend({
		idAttribute: 'name',
		initialize: function(){
			this.isFetched = false;
		},

		fetch: function(opts){
			var me = this;
			return Backbone.Model.prototype.fetch.call(this, opts).then(function(){
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
			return Backbone.Model.prototype.save.call(this, attrs, opts).then(function(){
				me.isFetched = true;
			});
		},

		value: function(val) {
			if(typeof val == 'undefined')
				return this.get('value');
			else
				this.set('value', val);
		}
	});

	var CollectionSettings = Setting.extend({
		initialize: function(attrs, options){
			this.collectionName = options.collectionName;
			this.set('name', 'collection_' + this.collectionName);
		}
	})

	var getSettings = function(name) {
		var deferred = $.Deferred(),
			settings = new Settings({name: name})
		;

		settings.fetch({}).always(function(){
			deferred.resolve(settings);
		});

		return deferred.promise();
	};


	return {
		Setting: Setting,
		CollectionSettings: CollectionSettings
	};
});
