define(['jquery', 'underscore', 'backbone', 'baseController'], function($, _, Backbone, BaseController){
	"use strict";
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
				});
				this.listenTo(this.content, 'save', function(routes){
					this.trigger('save', routes);
				});
				this.regions.content.view = this.content;
			}
			if(!this.title)
				this.title = 'No title';

			this.titleView = new TitleView({title: this.title});
			this.regions.title.view = this.titleView;

			if(typeof this.init == 'function')
				this.init();
		}
	});

	var TitleView = Backbone.View.extend({
		tagName: 'h2',
		className: 'tule-pagetitle js-pagetitle',
		initialize: function(options){
			this.title = options.title;
		},
		render: function(){
			this.el.innerHTML = this.title;
		}
	});

	return PageController;
});