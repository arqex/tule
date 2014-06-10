var routes = require('./routes.js'),
	_ = require('underscore'),
	config = require('config'),
	express = require('express'),
	Path = require('path')
;

var app = false, hooks;

var RouteManager = function(){};

RouteManager.prototype = {
	init: function(appObject){
		app = appObject;
		hooks = app.hooks;
		this.statics = [];
		this.resetRoutes();
		//add first mandatory static route
		app.use('/r/tule', express.static('public'));
		hooks.on('plugin:activated', this.resetRoutes.bind(this));
		hooks.on('plugin:deactivated', this.resetRoutes.bind(this));
	},
	addRoute: function(routeData){
		var baseUrl = config.mon.baseUrl,
			controller = routeData.controller,
			routeOpts = routeData.route.split('::'),
			route = routeOpts.length == 2 ? routeOpts[1] : routeOpts[0],
			method = routeOpts.length == 2 ? routeOpts[0] : 'get'
		;

		//The controller may be defined by a path
		if(typeof controller != 'function'){
			var opts = controller.split('::'),
				//If the file starts with / is a plugin route
				file = opts[0].length && opts[0][0] == '/' ? require(config.path.plugins + opts[0]) :require(config.path.controllers + '/' + opts[0]),
				func = opts[1]
			;
			controller = func ? file[func] : file;
		}

		//All the server routes goes to the /api route but the default one
		if(route && route != '*'){
			if(route.length && route[0] != '/')
				route = '/' + route;
			route = '/api' +  route;
		}

		console.log('**Added route: ' + method + ' ' + route); //+ ' ' + controller);

		if(baseUrl[baseUrl.length - 1] == '/')
			baseUrl = baseUrl.substring(0, baseUrl.length -1);

		app[method](baseUrl + route, controller);
	},

	addStaticDirectory: function(route){
		if(!route.url || !route.path)
			return console.log('Cant add route ' + route);

		if(route.url[0] && route.url[0] != '/')
			route.url = '/' + route.url;

		var url = config.mon.baseUrl + 'r' + route.url,
			path = Path.join(config.path.plugins, route.path)
		;

		console.log('Adding static route! ' + route);
		var middleware = express.static(path, {maxAge: 0});
		this.statics.push(middleware);
		app.stack.unshift({route: url, handle: middleware });
	},

	resetStaticRoutes: function(){
		var me = this;
		for (var i = app.stack.length - 1; i >= 0; i--) {
			var f = app.stack[i].handle,
				staticIndex = this.statics.indexOf(f)
			;
			if(staticIndex !== -1){
				app.stack.splice(i, 1);
				this.statics.splice(staticIndex, 1);
			}
		};

		hooks.filter('routes:static', []).then(function(statics){
			console.log(statics);
			statics.forEach(function(s){
				me.addStaticDirectory(s);
			});
			console.log(app.stack);
		});
	},

	resetRoutes: function(){
		var me = this,
			routesClone = JSON.parse(JSON.stringify(routes))
		;

		console.log('Here we are: ROUTING');
		//Reset all the routes;
		['get', 'post', 'put', 'delete'].forEach(function(method){
			app.routes[method] = [];
		});
		hooks.filter('routes:server', routesClone).then(function(allRoutes){
			console.log('Adding routes:');
			console.log(allRoutes);
			_.each(allRoutes, me.addRoute);
		});

		//Also static routes
		this.resetStaticRoutes();
	}
};

module.exports = new RouteManager();
