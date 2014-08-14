define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){
	'use strict';

	var Region = Backbone.View.extend({
		initialize: function(opts){
			this.selector = opts.selector || '#noselector#';
		},

		show: function(view){
			if(this.view)
				this.view.remove();
			this.view = view;

			this.render();

			this.listenTo(this.view, 'save', function(routes){
				this.trigger('save', routes);
			});

		},
		render: function(){
			if(!this.view)
				return this.$el.html('Loading...');

			this.$el.html(this.view.el);
			this.view.render();
		}
	});

	return Region;
});