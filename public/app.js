var deps = ['jquery', 'underscore', 'backbone', 'router', 'services',
	'modules/collections/collectionService',
	'modules/settings/settingsService',
	'modules/datatypes/datatypeService',
	'modules/core/mainController'
];

define(deps, function($, _, Backbone, Router, Services, CollectionService, SettingsService, DatatypeService, MainController){
	'use strict';

	// Here the magic starts
	var init = function() {
		// Take the initial settings
		var settings	 = window.tuleSettings;
		console.log(settings);
		window.tuleSettings = undefined;

		initServices(settings).then(function(){
			//Start the main controller
			new MainController({el: $('html'), initSettings: settings});

			initRouter(settings);
			initObservers( settings );
		});

	};

	var initServices = function(settings){
		//TODO: Services should be fetched from the server
		return initDatatypes(settings).then(function(){
			Services.init(settings);
			Services.add('collection', CollectionService);
			Services.add('settings', SettingsService);
		});
	};

	var initRouter = function(settings) {
		Router.init({routesData: settings.clientRoutes, baseUrl: settings.url.base});
	};

	var initDatatypes = function(settings){
		var deferred = $.Deferred(),
			deps = []
		;

		Services.add('datatype', DatatypeService);

		// Get the types from the settings;
		_.each(settings.datatypes, function(definition){
			deps.push(definition.path);
		});

		// Require them
		require(deps, function(){
			_.each(arguments, function(typeOptions){
				DatatypeService.add(typeOptions);
			});
			deferred.resolve();
		});

		return deferred.promise();
	};

	var initObservers = function( settings ) {
		var observers = settings.observers;

		if( !observers || !observers.length )
			return;

		_.each( observers, function( o ){
			require(
				observers,
				function( o ){
					// If there is a init method, give the settings
					// to it
					if( o && o.init )
						o.init( settings );

				},
				function( err ) {
					console.log( err );
				}
			);
		});
	};

	// Let's rock and roll
	init();
});