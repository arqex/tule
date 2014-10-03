define(
['jquery', 'underscore', 'backbone', 'events', 'backbone-query-params'],
function($, _, Backbone, Events) {

"use strict";

var Router = Backbone.Router.extend({

	//Routes are loaded automatically in the initialize method.
	routes: {},

	initialize: function(options){
		var me = this,
			baseUrl = options.baseUrl[ options.baseUrl.length - 1 ] == '/' ?
				options.baseUrl :
				options.baseUrl + '/'
		;

		if(baseUrl[0] == '/')
			baseUrl = baseUrl.slice(1);

		_.each(options.routesData.reverse(), function(routeData){
			if(routeData.controller) {

				var r = routeData.route[0] == '*' ?
					routeData.route :
					baseUrl + routeData.route
				;

				// Handle the root of the urlbase properly
				if( routeData.route == '(/)' )
					r = baseUrl.slice( 0, baseUrl.length -1 ) + routeData.route;

				me.route( r, routeData.controller, function(){
					var args = arguments;
					Events.trigger('tule:route', routeData.controller, args);
				});
			}
		});
	},

	start: function(){
		// Turn the router on
		Backbone.history.start({pushState: true});

		// Listen to click on links
		$(document).on("click", "a", function(e) {

			// If prevented don't route
			if(e.isDefaultPrevented()) return;

			var a = e.currentTarget;

			if(a.origin == location.origin){
				e.preventDefault();
				Backbone.history.navigate(a.pathname + a.search + a.hash, true);
			}
		});
	}
});

return {
	init: function(options){
		var router = new Router( options );
		router.start();
	}
};

});