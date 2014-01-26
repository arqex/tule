define(['router', 'views/navigationView', 'models/navCollection'], function(Router, NavigationView, NavCollection){
	var init = function() {
		Router.init();
		var nav = new NavigationView({collection: new NavCollection(navData), el: 'nav.navigation'});
		nav.render();
	}

	return {
		init: init
	};
});