var deps = [
	'jquery', 'underscore', 'backbone', 'router', 
	'modules/core/dispenser', 'modules/core/mainController', 
	'modules/navigation/navigationController'
];

define(deps, function($, _, Backbone, Router, Dispenser, Main, Navigation){

	var init = function() {
		var settings = window.tuleSettings;
		window.tuleSettings = undefined;

		registerDataTypes(settings.datatypes, settings.datatypesPath, function(){
			// App's init point
			var navigation 	= new Navigation({routes: settings.routes, el: $('nav')}),
				main 		= new Main({navigation: navigation, el: $(document)})
			;

			Backbone.Events.on('tuleRoute', function(file, method, args){
				main.loadContent(file, method, args);
			});

			Router.init();
			Backbone.history.on('route', function() {
				navigation.manager("/" + this.fragment);
			});
		});
	};

	var registerDataTypes = function(datatypes, path, clbk) {
		var globals = new Dispenser.SettingsDoc({ name: 'globals' });
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