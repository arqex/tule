define(['jquery', 'underscore', 'router', 'views/navigationView', 'models/navCollection', 'config'],
	function($, _, Router, NavigationView, NavCollection, config){
	var init = function() {
		registerDataTypes(function(){
			Router.init();
			var nav = new NavigationView({collection: new NavCollection(navData), el: 'nav.navigation'});
			nav.render();
		});
	};

	var registerDataTypes = function(clbk){
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

	return {
		init: init
	};
});