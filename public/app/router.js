define(['jquery', 'underscore', 'backbone', 'config', 'backbone-query-params'], function($, _, Backbone, config){
var nofunction = function(){},
	QRouter = Backbone.Router.extend({
		//Routes are loaded automatically in the initialize method.
		routes: {},
		initialize: function(){
			var me = this;
			_.each(_.keys(config.routes).reverse(), function(route){
				var controllerData = config.routes[route],
					controllerParts = controllerData.split('#'),
					file = controllerParts[0],
					method = controllerParts[1]
				;

				me.route(route, controllerData, function(){
					var args = arguments;
					require(['controllers/' + file], function(controller){
						controller[method].apply(me, args);
					});
				});
			});

			//this.listenTo(location.hash, 'change', this.nofunction);
		},
		nofunction: function(){},
		defaultAction: function(){
			console.log('Does nothing');
		},
		loadController: function(){

		}
	}),
	init = function(){
		var router = new QRouter();
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