var deps = [
	'jquery', 'underscore', 'backbone', 'services',
	'baseController', 'modules/menu/menuController',
	'region', 'alerts', 'events'
];

define(deps, function($, _, Backbone, Services, BaseController, MenuController, Region, Alerts, Events){

	var MainController = BaseController.extend({
		regionSelectors: {
			menu: '#menuRegion',
			page: '#pageRegion'
		},

		init: function(opts) {
			// Show the menu
			var menuController =  new MenuController({
				navigationData: opts.initSettings.navigation,
				template: this.regions.menu.el.innerHTML
			});

			this.regions.menu.show(menuController);

			//Listen for route changes to load new pages
			this.listenTo(Events, 'tule:route', this.loadPage);

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
			require([file], function(Controller){
				var controller = new Controller({args: args});
				me.regions.page.show(controller);
			});
		}
	});

	return MainController;
});