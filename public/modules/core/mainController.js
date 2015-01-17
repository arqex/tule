var deps = [
	'jquery', 'underscore', 'backbone', 'services',
	'baseController', 'modules/menu/menuController',
	'region', 'alerts', 'events'
];

define(deps, function($, _, Backbone, Services, BaseController, MenuController, Region, Alerts, Events){
	'use strict';

	var MainController = BaseController.extend({
		regionSelectors: {
			menu: '#menuRegion',
			page: '#pageRegion'
		},

		init: function(opts) {
			// Show the menu
			var me = this,
				menuController =  new MenuController({
				initSettings: opts.initSettings,

				template: this.regions.menu.el.innerHTML
			});

			this.settings = opts.initSettings.tule;
			this.settings.url = opts.initSettings.url;

			this.regions.menu.show(menuController);

			//Listen for route changes to load new pages
			this.listenTo(Events, 'tule:route', this.loadPage);

			//Listen for updates in the settings
			this.listenTo(Events, 'settings:updated', function(settings){
				me.settings = settings;
			});

			//Add alerts
			this.$('body').append(Alerts.alerter.el);
		},

		/**
		 * Require controller's file and place a controller instance
		 * in the page region
		 * @param  {String} file Controller's file path
		 * @param  {Object} args Any argument to initialize the controller
		 * @return {undefined}
		 */
		loadPage: function(file, args){
			var me = this;
			require([file],
				function(Controller){
					var controller = new Controller({args: args, tuleSettings: me.settings});
					me.regions.page.show(controller);
				},
				function( err ){
					console.log( err );
				})
			;
		}
	});

	return MainController;
});