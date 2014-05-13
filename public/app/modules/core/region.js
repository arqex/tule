"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){
	var Region = Backbone.View.extend({
		initialize: function(opts){
			this.setElement(opts.node);
		},

		show: function(view){
			if(this.view)
				this.view.remove();
			this.view = view;
			this.view.render();
			this.$el.html(this.view.el);
		}
	});

	return Region;
});