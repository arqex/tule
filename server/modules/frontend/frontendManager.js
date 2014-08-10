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
		{route: 'settings/navigation', controller: 'modules/settings/navigationController'},
		{route: 'settings/collections', controller: 'modules/settings/collectionSettingsController'},
		{route: 'settings/general', controller: 'modules/settings/tuleSettingsController'},
		{route: 'plugins', controller: 'modules/plugins/pluginController'},
		{route: '*path', controller:'modules/core/404Controller'}
	],
	defaultFrontendSettings = {
		datatypes: ['string', 'object', 'field', 'boolean', 'integer', 'float', 'array', 'select'], //['relation'],
		datatypesPath: 'modules/datatypes/'
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

var getCollectionNavigationItems = function(items){

	var deferred = when.defer();

	db.getCollectionNames(function(err, names){

		if(err){
			return deferred.reject(err);
		}

		var hiddenCollections = [config.tule.settingsCollection, 'system.indexes'],
			collections = names
				.filter(function(collection){
					return hiddenCollections.indexOf(collection) == -1;
				})
				.sort(),
			collectionItems = []
		;

		for (var i = 0; i < collections.length; i++) {
			var c = collections[i];
			collectionItems.push({text: c, url: '/collections/list/' + c});
		}

		items.Collections = collectionItems;

		deferred.resolve(items);
	});

	return deferred.promise;
};

/**
 * Generates a default navigation adding some collections to the menu, when
 * there is no navigation data stored.
 *
 * @param  {array} navigation Current navigation settings.
 * @return {String|Promise}   The resulting navigation.
 */
var generateDefaultNavigation = function(navigation) {

	// Only if there is no navigation set
	if(typeof navigation != 'undefined')
		return navigation;

	var deferred = when.defer(),
		defaults = JSON.parse(JSON.stringify(defaultNavigationItems))
	;


	// Get all items
	getCollectionNavigationItems(defaults)
		.then(function(items){
			navigation = [
				{ // Five collections
					text: 'Collections',
					url: '#',
					subItems: items.Collections.slice(0,5)
				},
				{ // Settings
					text: 'Settings',
					url: '#',
					subItems: items.Settings
				},
				{ text: 'Plugins', url: items.Plugins[0].url}
			];
			deferred.resolve(navigation);
		})
		.catch(function(){
			// If we got an error getting the collections use just settings and plugins
			var items = defaults;

			navigation = [
				{ // Settings
					text: 'Settings',
					url: '#',
					subItems: items.Settings
				},
				{ text: 'Plugins', url: items.Plugins[0].url}
			];
			deferred.resolve(navigation);
		})
	;

	return deferred.promise;
};

module.exports = {
	init: function(app){
		hooks = app.hooks;
		console.log('ROUTES FOR THE NAVIGATION!! ----------------');

		settings.setStatic('routes:client', defaultClientRoutes, true);
		settings.setStatic('frontend:settings', defaultFrontendSettings, true);

		// Prepare navigation items
		settings.setStatic('navigation:items', defaultNavigationItems, true);
		hooks.addFilter('settings:get:navigation:items', getCollectionNavigationItems);

		// If there is no navigation saved, generate one
		hooks.addFilter('settings:get:tuleNavigation', generateDefaultNavigation);

		// If there is no settings saved, generate them on the fly
		hooks.addFilter('settings:get:tule', function(settings){
			if(!settings)
				return _.clone(defaultTuleSettings);
			return settings;
		});
	},

	getFrontSettings: function(){
		var settingsPromise = settings.get('frontend:settings'),
			routesPromise = settings.get('routes:client'),
			tulePromise = settings.get('tule'),
			navigationPromise = settings.get('tuleNavigation'),
			deferred = when.defer()
		;

		settingsPromise.then(function(settings){
			routesPromise.then(function(routes){
				tulePromise.then(function(tuleSettings){
					navigationPromise.then(function(navigation){
						settings.clientRoutes = routes;
						settings.tule = tuleSettings;
						settings.navigation = navigation;
						deferred.resolve(settings);
					});
				});
			});
		});

		return deferred.promise;
	}
};
