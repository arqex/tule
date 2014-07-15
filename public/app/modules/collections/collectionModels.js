define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){
	"use strict";

	var Document = Backbone.Model.extend({
		idAttribute: '_id',
		initialize: function(attrs, opts){
			this.collectionName = opts.collectionName;
		},
		urlRoot: function(){
			return '/api/docs/' + this.collectionName;
		}
	});

	var Collection = Backbone.Collection.extend({
		model: Document,
		initialize: function(options){
			var me = this;
			this.collectionName 	= options.collectionName;
			this.url 	= '/api/docs/' + this.collectionName;
			this.each(function(model){
				model.collectionName = me.collectionName;
			});
		}
	});

	var Query = Backbone.Model.extend({
		initialize: function(attrs, options){
			this.objectID = options.objectID;
			this.collectionName = options.collectionName;
			this.url = '/api/docs/' + this.collectionName + '/' + this.objectID;
		}
	});

	return {
		Document: Document,
		Collection: Collection,
		Query: Query
	};

});