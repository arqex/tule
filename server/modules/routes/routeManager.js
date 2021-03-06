'use strict';

var routes = require('./routes.js'),
	_ = require('underscore'),
	config = require('config'),
	settings = config.require('settings'),
	express = require('express'),
	Path = require('path'),
	log = require('winston')
;

var app = false, hooks;

var baseUrl, assetsUrl, apiUrl;

var RouteManager = function(){};

RouteManager.prototype = {
	init: function(appObject){
		var me = this;

		app = appObject;
		hooks = app.hooks;
		this.statics = [];

		settings.setStatic('routes:server', routes);
		settings.setStatic('routes:static', []);

		//Tule's public folder is added as a common middleware in middlewareManager.js

		me.resetRoutes();

		hooks.on('plugin:activated', me.resetRoutes.bind(me));
		hooks.on('plugin:deactivated', me.resetRoutes.bind(me));
	},

	addRoute: function(routeData){
		var controller = routeData.controller,
			routeOpts = routeData.route.split('::'),
			route = routeOpts.length == 2 ? routeOpts[1] : routeOpts[0],
			method = routeOpts.length == 2 ? routeOpts[0] : 'get'
		;

		//The controller may be defined by a path
		if(typeof controller != 'function'){
			try {
				var opts = controller.split('::'),
					//If the file starts with / is a plugin route
					file = opts[0].length && opts[0][0] == '/' ? require(config.path.plugins + opts[0]) :require(config.path.controllers + '/' + opts[0]),
					func = opts[1]
				;
				controller = func ? file[func] : file;
			}
			catch ( e ) {
				return log.error(e.stack);
			}
		}


		//All the server routes goes to the api route but the default one
		if(route && route != '*'){
			if(route.length && route[0] != '/')
				route = '/' + route;

			route = Path.join( apiUrl, route );
		}

		log.info('**Added route ', {method: method, route: route});

		app[method]( route, controller );
	},

	/**
	 * Finds tule's static files handler in the middleware stack and returns
	 * its index. Useful to add all the static routes after tule's one and
	 * make use of the jsx transformer
	 *
	 * @return {number} The index
	 */
	getTuleStaticIndex: function(){
		var found = false,
			i = 0
		;

		while( !found && i < app.stack.length ){
			if( app.stack[i].route.indexOf('/tule') != -1 )
				found = i;
			i++;
		}

		return found + 1;
	},

	addStaticDirectory: function(route){
		log.info( 'ADDING STATIC ROUTE ' + route);
		if(!route.url || !route.path)
			return log.error('Cant add route ' + route);

		// Safely add a first slash
		if(route.url[0] && route.url[0] != '/')
			route.url = '/' + route.url;

		var url = assetsUrl + route.url,
			path = Path.join(config.path.plugins, route.path)
		;

		var middleware = express.static(path, {maxAge: 0});
		this.statics.push(middleware);

		// Insert after the JSX transformer
		app.stack.splice( this.getTuleStaticIndex(), 0, {route: url, handle: middleware });
		console.log( app.stack );

		log.info('**Added static route', route);
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
		}

		settings.get('assetsUrl')
			.then( function( url ){
				assetsUrl = url;
			})
			.then( settings.get.bind(settings, 'routes:static') )
			.then( function( statics ){
				statics.forEach(function(s){
					me.addStaticDirectory(s);
				});
			})
			.catch( function( err ){
				log.error( err.stack );
			})
		;
	},

	resetRoutes: function(){
		var me = this;

		//Reset all the routes;
		['get', 'post', 'put', 'delete'].forEach(function(method){
			app.routes[method] = [];
		});

		settings.get('baseUrl')
			.then( function( url ){
				baseUrl = url;
			})
			.then( settings.get.bind(settings, 'apiUrl') )
			.then( function( url ){
				apiUrl = url;
			})
			.then( settings.get.bind(settings, 'routes:server'))
			.then(function(allRoutes){
				_.each(allRoutes, me.addRoute);
			})
			.catch( function( err ){
				log.error( err.stack );
			})
		;

		log.info('Reseting routes');

		//Also static routes
		this.resetStaticRoutes();
	}
};

module.exports = new RouteManager();
