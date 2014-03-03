define(['jquery', 'underscore', 'router', 'modules/nav/navigation', 'backbone', 'models/mdispenser'],
	function($, _, Router, Navigation, Backbone, Dispenser){

	var init = function() {
		registerDataTypes(function(){
			fetchNavigation(function(navData){
				Router.init();
				var nav = new Navigation.NavCollectionView({
					collection: new Navigation.NavCollection(navData),
					el: 'nav.navigation'
				});
				nav.render();

				// On hash change set current navigation
				Backbone.history.on('route', function(name, args) {
					onHashChange(args);
				});
			});
		});
	};

	var registerDataTypes = function(clbk) {
		var globals = new Dispenser.SettingsDoc({ name: 'globals' });
		var promise = globals.fetch();

		$.when(promise).then(function(){
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

	var fetchNavigation = function(clbk) {
		var navigation = new Dispenser.SettingsDoc({ name: 'navData'});
		var promise = navigation.fetch();

		$.when(promise).then(function(){
			clbk(navigation.attributes.routes);
		});
	};

	var onHashChange = function(args) {
		var navigation = $('.navitem').removeClass('navcurrent');
		var current = $( '.navlink[href="'+location.pathname+'"]' ).closest('.navitem').trigger('selectItem');
	};

	return {
		init: init
	};
});