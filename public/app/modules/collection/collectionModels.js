"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){

	var Document = Backbone.Model.extend({
		idAttribute: '_id',
		initialize: function(attrs, opts){
			this.type = opts.type;
		},

		urlRoot: function(){
			return '/api/docs/' + this.type;
		}
	});

	var Collection = Backbone.Collection.extend({
		model: Document,
		initialize: function(options){
			var me = this;
			this.type = options.type;
			this.url = '/api/docs/' + this.type;
			this.each(function(model){
				model.type = me.type;
			});
		}
	});

	var Query = Backbone.Model.extend({
		initialize: function(attrs, options){
			this.type = options.type;
			this.url = '/api/docs/' + this.type;
		}
	});

	return {
		getDocument: Document,
		getCollection: Collection,
		getQuery: Query
	};

});