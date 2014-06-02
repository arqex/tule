"use strict";

var deps = [
	'jquery', 'underscore', 'backbone', 'services',
	'baseController', 'pageController', 'text!./tpls/settingsNavigationTpl.html',
	'./settingsViews'
];

define(deps, function($, _, Backbone, Services, BaseController, PageController, tplSource, SettingsViews){
	var SettingsController = BaseController.extend({
		template: $(tplSource).find('#settingsNavigationTpl').html(),
		regionSelectors: {
			'preview': '.preview',
			'toolsbox': '.toolsbox'
		},

		init: function(opts){
			this.subViews = {};

			var me 			= this,
				deferred 	= $.Deferred()
			;

			this.querying = deferred.promise();

			// Override
			this.tpl = this.controllerTpl;
			var promise = Services.get('settings').getNavigationItems();

			Services.get('settings').getNavigation().then(function(navData){
				promise.then(function(navigationItems){
					me.subViews['preview'] = new SettingsViews.NavigationPreviewView({
						routes: navData.get('routes')
					});

					me.subViews['toolsbox'] = new SettingsViews.NavigationToolsboxView({
						collections: navigationItems
					});

					me.regions.preview.show(me.subViews.preview);
					me.regions.toolsbox.show(me.subViews.toolsbox);

					me.listenTo(me.subViews['preview'], 'save', function(routes){
						me.trigger('save', routes);
					});

					deferred.resolve();
				});
			});
		}
	});

	return PageController.extend({
		title: 'Settings nav',
		contentView: SettingsController
	});
});
