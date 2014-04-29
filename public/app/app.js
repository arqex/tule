define(['jquery', 'underscore', 'router', 'modules/nav/navigation', 'backbone', 'models/dispenser'],
	function($, _, Router, Navigation, Backbone, Dispenser){

	var init = function() {
		var settings = window.tuleSettings;
		window.tuleSettings = undefined;

		registerDataTypes(settings.datatypes, settings.datatypesPath, function(){
			startNavigation(settings.routes);
		});
	};

	var startNavigation = function(routes){
		Router.init();
		var nav = new Navigation.NavCollectionView({
			collection: new Navigation.NavCollection(routes),
			el: 'nav.navigation'
		});
		nav.render();

		// On hash change set current navigation
		selectFirstNavElement(); // When load at first from url (no clicking menu)
		Backbone.history.on('route', function(name, args) {
			selectCurrentNavElement();
		});
	}

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

	var selectCurrentNavElement = function() {
		$('.navitem').removeClass('navcurrent');
		$( '.navlink[href="'+location.pathname+'"]' ).closest('.navitem').trigger('currentNavigation');
	};

	var selectFirstNavElement = function() {
		$( '.navlink[href="'+location.pathname+'"]' ).closest('.navitem').trigger('firstNavigation');
	};

	return {
		init: init
	};
});