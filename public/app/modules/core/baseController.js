"use strict";

define(['jquery', 'underscore', 'backbone', 'region'], function($, _, Backbone, Region){
	var BaseController = Backbone.View.extend({
		// Template: selector, string
		regionSelectors: {},

		initialize: function(options){
			if(this.template)
				this.el.innerHTML = this.template;

			this.createRegions();

			if(typeof this.init == 'function')
				this.init(options);
		},

		createRegions: function(){
			var me = this;
			this.regions = {};
			_.each(this.regionSelectors, function(selector, regionName){
				if(!me.regions[regionName])
					me.regions[regionName] = new Region({el: me.$(selector)});
			});
		},

		render: function(){
			var me = this;
			_.each(this.regions, function(region){
				region.render();
			});
		}
	});

	return BaseController;
});