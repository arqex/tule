'use strict';

var config = require('config'),
	_ = require('underscore'),
	when = require('when'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	settings = require(config.path.modules + '/settings/settingsManager')
;

var datatypesPath = 'modules/datatypes/',
	defaultClientRoutes = [
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
		datatypes: [
			{ path: datatypesPath + 'string/stringType' },
			{ path: datatypesPath + 'object/objectType' },
			{ path: datatypesPath + 'field/fieldType' },
			{ path: datatypesPath + 'boolean/booleanType' },
			{ path: datatypesPath + 'integer/integerType' },
			{ path: datatypesPath + 'float/floatType' },
			{ path: datatypesPath + 'array/arrayType' },
			{ path: datatypesPath + 'select/selectType' },
			{ path: datatypesPath + 'date/dateType' },
			{ path: datatypesPath + 'relation/relationType' }
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
		pageSize: 10,
		compositeRelated: false,
		dateFormat: 'd/mm/yy',
		timeFormat: 'h:mm',
		firstDayOfWeek: 1
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

		settings.setStatic('routes:client', defaultClientRoutes, true);
		settings.setStatic('frontend:settings', defaultFrontendSettings, true);

		settings.setStatic('frontend:observers', [], true);

		// Prepare navigation items
		settings.setStatic('navigation:items', defaultNavigationItems, true);
		hooks.addFilter('settings:get:navigation:items', getCollectionNavigationItems);

		// If there is no navigation saved, generate one
		hooks.addFilter('settings:get:tuleNavigation', generateDefaultNavigation);

		// Apply defaults for mandatory settings
		hooks.addFilter('settings:get:tule', function(settings){
			return _.extend({}, defaultTuleSettings, settings || {});
		});
	},

	getFrontSettings: function(){
		var deferred = when.defer();

		when.all([
				settings.get('frontend:settings'),
				settings.get('routes:client'),
				settings.get('tule'),
				settings.get('tuleNavigation'),
				settings.get('frontend:observers')
			])
			.then( function( values ) {
				var frontSettings = _.extend({}, values[0], {
					clientRoutes: values[1],
					tule: values[2],
					navigation: values[3],
					observers: values[4]
				});

				deferred.resolve( frontSettings );
			})
			.catch( function( err) {
				deferred.reject( err );
			})
		;

		return deferred.promise;
	}
};
