"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){

	var Document = Backbone.Model.extend({
		idAttribute: '_id'
	});

	var Settings = Document.extend({
		idAttribute: 'name',
		initialize: function(){
			this.isFetched = false;
		},
		fetch: function(opts){
			var me = this;
			return Document.prototype.fetch.call(this, opts).then(function(){
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
			return Document.prototype.save.call(this, attrs, opts).then(function(){
				me.isFetched = true;
			});
		}
	});

	var DocCollection = Backbone.Collection.extend({
		model: Document,
		initialize: function(models, options){
			this.type = options.type;
			this.url = '/api/docs/' + this.type;
		}
	});

	var Query = Backbone.Model.extend({
		initialize: function(attrs, options){
			this.type = options.type;
			this.url = '/api/docs/' + this.type;
		}
	});

	var SettingsCollection = Settings.extend({
		initialize: function(attrs, opts){
			this.name = opts.name;
			this.set('name', 'collection_' + this.name);
			this.settingsFetched = false;
		},
		query: function(opts){
			var query = new Query([], {type: this.name}),
				deferred = $.Deferred(),
				me = this
			;
			query.fetch({
				data: opts,
				success: function(){
					query.set('documents', new DocCollection(query.get('documents'), {type: me.name}));
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
		Settings: Settings,
		SettingsCollection: SettingsCollection,
		getSettings: getSettings
	};
});
