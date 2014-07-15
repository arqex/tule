define(
['jquery', 'backbone', './navigationView', './logoView', 'baseController', 'events'],
function($, Backbone, NavigationView, LogoView, BaseController, Events){
	"use strict";

	var MenuController = BaseController.extend({

		regionSelectors: {
			logo: '#logoRegion',
			navigation: '#navigationRegion'
		},

		init: function(opts){
			var navigation = new NavigationView({navigationData: opts.navigationData}),
				logo = new LogoView({model: new Backbone.Model({title: 'Tule', url: '/'})})
			this.regions.navigation.show(navigation);
			this.regions.logo.show(logo);

			// React to URL changes to select the current menu
			this.listenTo(Events, 'tule:route', function(){
				navigation.select(location.href);
			});
			// Select existing menu items that match current url
			navigation.select(location.href);
		}

	});

	return MenuController;

});
