"use strict";

define(['jquery', 'underscore', 'backbone', 'region', 'mixins'], function($, _, Backbone, Region, mixins){
	var BaseView = Backbone.View.extend({
		constructor: function(options){
			options = options || {};

			//Create the state model
			var state = options.state || this.defaultState || {};
			this.currentState = new Backbone.Model(state);

			Backbone.View.prototype.constructor.apply(this, arguments);
		},
		state: function(name, value, options){
			if(typeof value == 'undefined')
				return this.currentState.get(name);

			return this.currentState.set(name, value, options);
		},

		getTemplateData: function(){
			var data = {state: this.currentState.toJSON()};
			if(this.model)
				_.extend(data, this.model.toJSON());
			return data;
		},

		render: function() {
			this.$el.html(this.tpl(this.getTemplateData()));

			return this;
		}
	});


	// Add mixin utilities
	_.extend(BaseView.prototype, mixins.ExtractTemplates);

	return BaseView;
});
