var routes = require('./routes.js'),
	_ = require('underscore'),
	config = require('config')
;

var app = false;

var RouteManager = function(){};
RouteManager.prototype = {
	init: function(appObject){
		app = appObject;
		console.log(routes);
		_.each(routes, this.addRoute);
	},
	addRoute: function(controllerData, routeData){
		var opts = controllerData.split('::'),
			routeOpts = routeData.split('::'),
			route = routeOpts.length == 2 ? routeOpts[1] : routeOpts[0],
			method = routeOpts.length == 2 ? routeOpts[0] : 'get',
			file = require(config.path.controllers + '/' + opts[0]),
			func = opts[1],
			controller = func ? file[func] : file
		;
		console.log(method + ' ' + opts[0] + ' ' + opts[1]);
		app[method](route, controller);
	}
};

module.exports = new RouteManager();