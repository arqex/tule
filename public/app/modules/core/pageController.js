"use strict";

define(['jquery', 'underscore', 'backbone', 'baseController'], function($, _, Backbone, BaseController){
	var PageController = BaseController.extend({
		regionSelectors: {
			title: '.pagetitleRegion',
			content: '.contentRegion',
		},
		template: '<div class="pagetitleRegion"></div><div class="contentRegion"></div>',
		initialize: function(options){
			if(this.template)
				this.el.innerHTML = this.template;

			this.createRegions();

			if(this.contentView){
				this.content = new this.contentView(options);
				this.listenTo(this.content, 'page:title:update', function(title){
					this.titleView.title = title;
					this.titleView.render();
				})
				this.regions.content.show(this.content);
			}
			if(!this.title)
				this.title = 'No title';

			this.titleView = new TitleView({title: this.title});
			this.regions.title.show(this.titleView);

			if(typeof this.init == 'function')
				this.init();
		}
	});

	var TitleView = Backbone.View.extend({
		tagName: 'h2',
		className: 'pagetitle',
		initialize: function(options){
			this.title = options.title;
		},
		render: function(){
			this.el.innerHTML = this.title;
		}
	});

	return PageController;
});