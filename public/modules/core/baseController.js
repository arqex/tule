"use strict";

define(['jquery', 'underscore', 'backbone', 'region', 'baseView'], function($, _, Backbone, Region, BaseView){

	/**
	 * The Base controller must have a HTML template and define some regions in it using the
	 * regionSelectors properties.
	 *
	 * It is used to coordinates subviews.
	 */
	var BaseController = BaseView.extend({
		// Template: selector, string
		regionSelectors: {},

		initialize: function(options){

			if(options.template)
				this.template = options.template;

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