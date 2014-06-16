var deps = [
	'jquery', 'underscore', 'backbone', 'router', 'services',
	'modules/settings/settingsModels', 'modules/core/mainController',
	'modules/navigation/navigationController',
	'modules/collection/collectionService', 'modules/settings/settingsService',
	'./eventsHub'
];

define(deps, function($, _, Backbone, Router, Services,
	Settings, Main, Navigation, CollectionService, SettingsService, Events){

	var init = function() {
		var settings	 = window.tuleSettings;
		window.tuleSettings = undefined;

		registerDataTypes(settings.datatypes, settings.datatypesPath, function(){
			Services.add('collection', CollectionService);
			Services.add('settings', SettingsService);

			// App's init point
			var navigation = new Navigation({routes: settings.navigation, el: $('nav')}),
				main	   = new Main({navigation: navigation, el: $(document)})
			;

			Backbone.Events.on('tuleRoute', function(file, args){
				main.loadContent(file, args);
			});

			Router.init({routes: settings.clientRoutes});
			Backbone.history.on('route', function() {
				navigation.manager("/" + this.fragment);
			});
		});
	};

	var registerDataTypes = function(datatypes, path, clbk) {
		_.each(datatypes, function(type){
			deps.push(path + type + '/' + type + 'Type');
		});

		require(deps, function(){
			clbk();
		});
	};

	return {
		init: init
	};
});
