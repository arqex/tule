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
			});
		});
	};

	var registerDataTypes = function(clbk) {
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

	var fetchNavigation = function(clbk) {
		var navigation = new Dispenser.SettingsDoc({ name: 'navData'});

		navigation.fetch().then(function(){
			var array = $.map(navigation.attributes.routes, function(value, index) {
				return [value];
			});

			clbk(array);
		});
	};

	return {
		init: init
	};
});