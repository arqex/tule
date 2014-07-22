var deps = ['jquery', 'underscore', 'backbone', 'router', 'services',
	'modules/collections/collectionService',
	'modules/settings/settingsService',
	'modules/datatypes/datatypeService',
	'modules/core/mainController'
];

define(deps, function($, _, Backbone, Router, Services, CollectionService, SettingsService, DatatypeService, MainController){
	// Here the magic starts
	var init = function() {
		// Take the initial settings
		var settings	 = window.tuleSettings;
		window.tuleSettings = undefined;

		initServices(settings).then(function(){
			//Start the main controller
			new MainController({el: $('html'), initSettings: settings});

			initRouter(settings);
		});

	};

	var initServices = function(settings){
		//TODO: Services should be fetched from the server
		return initDatatypes(settings).then(function(){
			Services.add('collection', CollectionService);
			Services.add('settings', SettingsService);
		});
	};

	var initRouter = function(settings) {
		Router.init({routes: settings.clientRoutes});
	};

	var initDatatypes = function(settings){
		var deferred = $.Deferred(),
			deps = []
		;

		Services.add('datatype', DatatypeService);


		_.each(settings.datatypes, function(type){
			deps.push(settings.datatypesPath + type + '/' + type + 'Type');
		});

		require(deps, function(){
			_.each(arguments, function(typeOptions){
				DatatypeService.add(typeOptions);
			});
			deferred.resolve();
		});

		return deferred.promise();
	};

	// Let's rock and roll
	init();
});