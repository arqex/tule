define(
['jquery', 'backbone', './navigationView', './logoView', 'baseController', 'events'],
function($, Backbone, NavigationView, LogoView, BaseController, Events){
	'use strict';

	var MenuController = BaseController.extend({

		regionSelectors: {
			logo: '#logoRegion',
			navigation: '#navigationRegion'
		},

		init: function(opts){
			var navigation = new NavigationView({navigationData: opts.initSettings.navigation}),
				logo = new LogoView({
					model: new Backbone.Model({title: opts.initSettings.tule.siteTitle, url: '/'})
				})
			;

			this.regions.navigation.show(navigation);
			this.regions.logo.show(logo);

			// React to URL changes to select the current menu
			this.listenTo(Events, 'tule:route', function(){
				navigation.select(location.href);
			});

			// Update title on settings change
			this.listenTo(Events, 'settings:updated', function(settings){
				logo.model.set('title', settings.siteTitle);
			});

			// Update navigation items on when the navigation is updated
			this.listenTo(Events, 'navigation:updated', function(navigationData){
				navigation.createItems(navigationData).render();
				navigation.select(location.href);
			});

			// Select existing menu items that match current url
			navigation.select(location.href);
		}

	});

	return MenuController;

});
