var deps = ['jquery', 'underscore', 'backbone', 'router', 'services',
	'modules/collections/collectionService', 'modules/settings/settingsService',
	'modules/core/mainController'
];

define(deps, function($, _, Backbone, Router, Services, CollectionService, SettingsService, MainController){
	// Here the magic starts
	var init = function() {
		// Take the initial settings
		var settings	 = window.tuleSettings;
		window.tuleSettings = undefined;

		initServices();

		//Start the main controller
		new MainController({el: $('html'), initSettings: settings});

		initRouter(settings);
	};

	var initServices = function(){
		//TODO: Services should be fetched from the server
		Services.add('collection', CollectionService);
		//Services.add('settings', SettingsService);
	};

	var initRouter = function(settings) {
		Router.init({routes: settings.clientRoutes});
	};

	// Let's rock and roll
	init();
});