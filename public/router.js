define(
['jquery', 'underscore', 'backbone', 'events', 'backbone-query-params'],
function($, _, Backbone, Events) {

"use strict";

var Router = Backbone.Router.extend({

	//Routes are loaded automatically in the initialize method.
	routes: {},

	initialize: function(options){
		var me = this;
		_.each(options.routeData.reverse(), function(routeData){
			if(routeData.route && routeData.controller)
				me.route(routeData.route, routeData.controller, function(){
					var args = arguments;
					Events.trigger('tule:route', routeData.controller, args);
				});
		});
	},

	start: function(){
		// Turn the router on
		Backbone.history.start({pushState: true});

		// Listen to click on links
		$(document).on("click", "a", function(e) {

			// If prevented don't route
			if(e.isDefaultPrevented()) return;

			var a = e.target;

			if(a.origin == location.origin){
				e.preventDefault();
				Backbone.history.navigate(a.pathname, true);
			}
		});
	}
});

return {
	init: function(options){
		var router = new Router({routeData: options.routes});
		router.start();
	}
}

});