'use strict';

var config = require('config'),
	_ = require('underscore'),
	when = require('when'),
	db = require(config.path.modules + '/db/dbManager').getInstance()
;

var defaultClientRoutes = {
		'(/)': 'modules/core/homeController',
		'collections/list/:id(/page/:page)': 'modules/collection/collectionController',
		'settings': 'modules/settings/settingsController',
		'settings/navigation': 'modules/settings/settingsNavigation',
		'settings/collections': 'modules/settings/settingsController',
		'settings/general': 'modules/settings/settingsGeneral',
		'plugins': 'modules/plugins/pluginController'
	},
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
		console.log(app);
		hooks = app.hooks;

	},
	getFrontSettings: function(){
		console.log("+++++++++++++++++++++++++++HIJO DE FRUTA+++++++++++++++++++");
		settings.findOne({name: 'navData'}, function(err, navRoutes){
			if(!err && navRoutes.lengt !== 0)
				defaultFrontendSettings.navigation = navRoutes.routes;
		});


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
