var deps = [
	'jquery', 'underscore', 'backbone', 'router', 'services',
	'modules/settings/settingsModels', 'modules/core/mainController', 
	'modules/navigation/navigationController',
	'modules/collection/collectionService', 'modules/settings/settingsService'
];

define(deps, function($, _, Backbone, Router, Services, Settings, Main, Navigation, CollectionService, SettingsService){

	var init = function() {
		var settings = window.tuleSettings;
		window.tuleSettings = undefined;

		registerDataTypes(settings.datatypes, settings.datatypesPath, function(){
			Services.add('collection', CollectionService);
			Services.add('settings', SettingsService);

			// App's init point
			var navigation 	= new Navigation({routes: settings.routes, el: $('nav')}),
				main 		= new Main({navigation: navigation, el: $(document)})
			;

			Backbone.Events.on('tuleRoute', function(file, args){
				main.loadContent(file, args);
			});

			Router.init();
			Backbone.history.on('route', function() {
				navigation.manager("/" + this.fragment);
			});
		});
	};

	var registerDataTypes = function(datatypes, path, clbk) {
		var globals = new Settings.getDocument({ name: 'globals' });
		var promise = globals.fetch();

		promise.then(function(){
			var deps = [],
				path = globals.attributes.datatypesPath
			;

			_.each(globals.attributes.datatypes, function(type){
				deps.push(path + type + '/' + type + 'Type');
			});

			require(deps, function(){
				clbk();
			});
		});
	};

	return {
		init: init
	};
});