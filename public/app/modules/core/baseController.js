"use strict";

define(['jquery', 'underscore', 'backbone', './region'], function($, _, Backbone, Region){
	var BaseController = Backbone.View.extend({
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

	return BaseController;
});