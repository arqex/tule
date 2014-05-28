define(['jquery', 'underscore', 'backbone', 'config', 'backbone-query-params'], function($, _, Backbone, config){
var nofunction = function(){},
	Router = Backbone.Router.extend({
		//Routes are loaded automatically in the initialize method.
		routes: {},
		initialize: function(options){
			var me = this;
			_.each(options.routeData.reverse(), function(routeData){
				if(routeData.route && routeData.controller)
					me.route(routeData.route, routeData.controller, function(){
						var args = arguments;
						Backbone.Events.trigger('tuleRoute', routeData.controller, args);
					});
			});
		},
		nofunction: function(){},
		defaultAction: function(){
			console.log('Does nothing');
		},
		loadController: function(){

		}
	}),
	init = function(options){
		var router = new Router({routeData: options.routes});
		Backbone.history.start({pushState: true});
		// Capture the links requests
		$(document).on("click", "a:not([data-bypass])", function(evt) {
			var href = { prop: $(this).prop("href"), attr: $(this).attr("href") };
			var root = location.protocol + "//" + location.host;

			if (href.prop && href.prop.slice(0, root.length) === root) {
				evt.preventDefault();
				Backbone.history.navigate(href.attr, true);
			}
		});
	}

	return {
		init: init
	}
});