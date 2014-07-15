"use strict";

define(['jquery', 'underscore', 'backbone', 'region', 'mixins'], function($, _, Backbone, Region, mixins){
	var BaseView = Backbone.View.extend({
		constructor: function(options){

			//Create the status model
			var status = options.status || this.defaultStatus || {};
			this.currentStatus = new Backbone.Model(status);

			Backbone.View.prototype.constructor.apply(this, arguments);
		},
		status: function(name, value, options){
			if(typeof value == 'undefined')
				return this.currentStatus.get(name);

			return this.currentStatus.set(name, value, options);
		}
	});


	// Add mixin utilities
	_.extend(BaseView.prototype, mixins.ExtractTemplates);

	return BaseView;
});