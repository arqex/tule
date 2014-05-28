'use strict';

var config = require('config'),
	_ = require('underscore'),
	when = require('when'),
	db = require(config.path.modules + '/db/dbManager').getInstance()
;

var defaultClientRoutes = [
		{route: '(/)', controller: 'modules/core/homeController'},
		{route: 'collections/list/:id(/page/:page)', controller: 'modules/collection/collectionController'},
		{route: 'settings', controller: 'modules/settings/settingsController'},
		{route: 'settings/navigation', controller: 'modules/settings/settingsNavigation'},
		{route: 'settings/collections', controller: 'modules/settings/settingsController'},
		{route: 'settings/general', controller: 'modules/settings/settingsGeneral'},
		{route: 'plugins', controller: 'modules/plugins/pluginController'},
		{route: '*path', controller:'modules/core/404Controller'}
	],
	defaultFrontendSettings = {
		settingsCollection: 'monSettings',
		datatypes: ['array', 'boolean', 'float', 'integer', 'object', 'string', 'field', 'select'],
		datatypesPath: 'modules/datatypes/',
		navigation:[
			{text: 'Collection', url: '/collections/list/test'},
			{text: 'Settings', url: '/settings/general', subItems: [
				{text: 'General', url: '/settings/general'},
				{text: 'Navigation', url: '/settings/navigation'},
				{text: 'Collections', url: '/settings/collections'}
			]}
		]
	},
	settings = db.collection(config.mon.settingsCollection),
	hooks
;

module.exports = {
	init: function(app){
		hooks = app.hooks;
	},
	getFrontSettings: function(){
		settings.findOne({name: 'navData'}, function(err, navRoutes){
			if(!err && navRoutes && navRoutes.length !== 0)
				defaultFrontendSettings.navigation = navRoutes.routes;
		});


		var settingsPromise = hooks.filter('settings:front', defaultFrontendSettings),
			routesPromise = hooks.filter('routes:client', defaultClientRoutes),
			deferred = when.defer()
		;

		settingsPromise.then(function(settings){
			routesPromise.then(function(routes){
				settings.clientRoutes = routes;
				deferred.resolve(settings);
			});
		});

		return deferred.promise;
	}
};
