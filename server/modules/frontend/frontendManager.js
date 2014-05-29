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
	defaultNavigationItems = {
		'Settings': [
			{text: 'General', url: '/settings/general'},
			{text: 'Navigation', url: '/settings/navigation'},
			{text: 'Collections', url: '/settings/collections'}
		],
		'Plugins': [
			{text: 'Installed', url: '/plugins'}
		]
	},
	settings = db.collection(config.mon.settingsCollection),
	hooks
;

var getNavigationItems = function(req, res){
	var itemsPromise = hooks.filter('navigation:items', defaultNavigationItems);

	db.getCollectionNames(function(err, names){
		if(err){
			res.json(500, {error: 'There was an error fetching navigation items.'});
			return console.log('***** NAMES ERROR: ' + err);
		}

		var hiddenCollections = [config.mon.settingsCollection, 'system.indexes'],
			collections = names.filter(function(collection){
				return hiddenCollections.indexOf(collection) == -1;
			})
		;

		itemsPromise.then(function(items){
				var collectionsLinks = [];
				collections.forEach(function(collectionName){
					collectionsLinks.push({text: collectionName, url: '/collection/list/' + collectionName});
				});
				items.Collections = collectionsLinks;
				res.json(items);
			})
			.catch(function(err){
				res.json(500, {error: 'There was an error fetching navigation items.'});
				return console.log('***** ITEMS ERROR: ' + err);
			})
		;
	});
};

module.exports = {
	init: function(app){
		hooks = app.hooks;
		console.log("ROUTES FOR THE NAVIGATION!! ----------------");
		hooks.addFilter('routes:server', function(routes){
			routes.splice(-1, 0, {route: 'get::navigationItems', controller: getNavigationItems});
			return routes;
		});
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
