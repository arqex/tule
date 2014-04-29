var routes = require('./routes.js'),
	_ = require('underscore'),
	config = require('config'),
	hooks = require(config.path.modules + '/hooks/hooksManager')
;

var app = false;

var RouteManager = function(){};

RouteManager.prototype = {
	init: function(appObject){
		app = appObject;
		this.resetRoutes();
		hooks.on('plugin:activate', this.resetRoutes);
		hooks.on('plugin:deactivate', this.resetRoutes);
	},
	addRoute: function(controllerData, routeData){
		var baseUrl = config.mon.baseUrl,
			opts = controllerData.split('::'),
			routeOpts = routeData.split('::'),
			route = routeOpts.length == 2 ? routeOpts[1] : routeOpts[0],
			method = routeOpts.length == 2 ? routeOpts[0] : 'get',
			file = require(config.path.controllers + '/' + opts[0]),
			func = opts[1],
			controller = func ? file[func] : file
		;

		if(baseUrl[baseUrl.length - 1] == '/')
			baseUrl = baseUrl.substring(0, baseUrl.length -1);

		console.log('Added route: ' + method + ' ' + opts[0] + ' ' + opts[1]);
		app[method](baseUrl + route, controller);
	},
	resetRoutes: function(){
		var me = this;
		console.log('Here we are: ROUTING');
		hooks.filter('routes:server', routes).then(function(allRoutes){
			_.each(allRoutes, me.addRoute);
		});
	}
};

module.exports = new RouteManager();