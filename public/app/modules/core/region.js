"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){
	var Region = Backbone.View.extend({
		initialize: function(opts){
			this.selector = opts.selector || '#noselector#';
		},

		show: function(view){
			if(this.view)
				this.view.remove();
			this.view = view;
			this.$el
				.html('')
				.append(this.view.el)
			;
			this.render();
		},
		render: function(){
			if(this.view)
				this.view.render();
		}
	});

	return Region;
});