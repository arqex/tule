'use strict';

var config = require('config'),
	_ = require('underscore'),
	when = require('when')
;

var defaultClientRoutes = {
		'(/)': 'modules/core/homeController',
		'collections/list/:id(/page/:page)': 'modules/collection/collectionController',
		'config': 'modules/settings/settingsController',
		'plugins': 'modules/plugins/pluginController'
	},
	defaultFrontendSettings = {
		settingsCollection: 'monSettings',
		datatypes: ['array', 'boolean', 'float', 'integer', 'object', 'string', 'field', 'select'],
		datatypesPath: 'modules/datatypes/',
		routes:[
			{text: 'Collection', url: '/collections/list/test'},
			{text: 'Config', url: '/config'}
		]
	},
	hooks
;

module.exports = {
	init: function(app){
		console.log(app);
		hooks = app.hooks;
	},
	getFrontSettings: function(){
		var settingsPromise = hooks.filter('settings:front', defaultFrontendSettings),
			routesPromise = hooks.filter('routes:client', defaultClientRoutes),
			deferred = when.defer()
		;

		settingsPromise.then(function(settings){
			routesPromise.then(function(routes){
				routes['*path'] = 'modules/core/404Controller';
				settings.clientRoutes = routes;

				deferred.resolve(settings);
			});
		});

		return deferred.promise;
	}
};