"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){
	var Region = Backbone.View.extend({
		initialize: function(opts){
			this.setElement(opts.selector);
		},

		show: function(view){
			if(this.view)
				this.view.remove();
			this.view = view;
			this.view.render();
			this.$el.html(this.view.el);
		}
	});

	var PageController = Backbone.View.extend({
		tpl: '', // controller tpl
		subViews: {}, // key, view
		regionViews: {}, // regionId (node selector), viewId
		regions: {}, // regions showing views

		render: function(){
			if($.isEmptyObject(this.regions))
				this.createRegions();

			_.each(this.subViews, function(subView){
				subView.render();				
			});
		},

		createRegions: function(){
			this.$el.html(this.tpl);
			var me = this;
			_.each(this.regionViews, function(viewId, regionId){
				var region = new Region({selector: me.$(regionId)});
				region.show(me.subViews[viewId]);
				me.regions[regionId] = region;
			});
		}
	});

	return {		
		PageController: PageController
	}
});