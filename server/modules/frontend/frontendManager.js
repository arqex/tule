'use strict';

var config = require('config'),
	_ = require('underscore'),
	when = require('when'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	settings = require(config.path.modules + '/settings/settingsManager')
;

var defaultClientRoutes = [
		{route: '(/)', controller: 'modules/core/homeController'},
		{route: 'collections/list/:id(/page/:page)', controller: 'modules/collections/collectionController'},
		{route: 'settings', controller: 'modules/settings/settingsController'},
		{route: 'settings/navigation', controller: 'modules/settings/settingsNavigation'},
		{route: 'settings/collections', controller: 'modules/settings/settingsController'},
		{route: 'settings/general', controller: 'modules/settings/tuleSettingsController'},
		{route: 'plugins', controller: 'modules/plugins/pluginController'},
		{route: '*path', controller:'modules/core/404Controller'}
	],
	defaultFrontendSettings = {
		datatypes: ['string', 'object', 'field', 'boolean', 'integer', 'float', 'array', 'select'], //['relation'],
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
	defaultTuleSettings = {
		siteTitle: 'Tule',
		pageSize: 10
	},
	hooks
;

var getNavigationItems = function(req, res){
	var itemsPromise = hooks.filter('navigation:items', defaultNavigationItems);

	db.getCollectionNames(function(err, names){
		if(err){
			res.json(500, {error: 'There was an error fetching navigation items.'});
			return console.log('***** NAMES ERROR: ' + err);
		}

		var hiddenCollections = [config.tule.settingsCollection, 'system.indexes'],
			collections = names.filter(function(collection){
				return hiddenCollections.indexOf(collection) == -1;
			})
		;

		itemsPromise.then(function(items){
				var collectionsLinks = [];
				collections.forEach(function(collectionName){
					collectionsLinks.push({text: collectionName, url: '/collections/list/' + collectionName});
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
		console.log('ROUTES FOR THE NAVIGATION!! ----------------');

		settings.setStatic('routes:client', defaultClientRoutes, true);
		settings.setStatic('frontend:settings', defaultFrontendSettings, true);

		hooks.addFilter('settings:get:tule', function(settings){
			if(!settings)
				return _.clone(defaultTuleSettings);
			return settings;
		});
	},

	getFrontSettings: function(){
		settings.get('navData')
			.then(function(err, navRoutes){
				if(!err && navRoutes && navRoutes.length !== 0)
					defaultFrontendSettings.navigation = navRoutes.routes;
			})
		;


		var settingsPromise = settings.get('frontend:settings'),
			routesPromise = settings.get('routes:client'),
			tulePromise = settings.get('tule'),
			deferred = when.defer()
		;

		settingsPromise.then(function(settings){
			routesPromise.then(function(routes){
				tulePromise.then(function(tuleSettings){
					settings.clientRoutes = routes;
					settings.tule = tuleSettings;
					deferred.resolve(settings);
				});
			});
		});

		return deferred.promise;
	}
};
