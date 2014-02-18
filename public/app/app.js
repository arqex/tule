define(['jquery', 'underscore', 'router', 'modules/nav/navigation', 'config', 'models/mdispenser'],
	function($, _, Router, Navigation, config, Dispenser){
	var init = function() {
		registerDataTypes(function(){
			fetchNavigation(function(navData){
				Router.init();
				var nav = new Navigation.NavCollectionView({collection: new Navigation.NavCollection(navData), el: 'nav.navigation'});
				nav.render();
			});
		});
	};

	var registerDataTypes = function(clbk) {
		var deps = [],
			path = config.globals.datatypesPath
		;

		_.each(config.globals.datatypes, function(type){
			deps.push(path + type + '/' + type + 'Type');
		});

		require(deps, function(){
			clbk();
		});
	};

	var fetchNavigation = function(clbk) {

		if(config.navData)
			clbk(config.navData);
	};

	return {
		init: init
	};
});