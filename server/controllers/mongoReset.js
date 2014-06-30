'use strict';
var collections = {
		dataSources: [],
		monSettings: [
			{
				name: 'globals',
				settingsCollection: 'monSettings',
				datatypes: ['array', 'boolean', 'float', 'integer', 'object', 'string', 'field', 'select'],
				datatypesPath: 'modules/datatypes/'
			},
			{
				name: 'navData',
				routes:[
					{text: 'Collection', url: '/collections/list/test'},
					{text: 'Settings', url: '/settings', subItems:[
						{text: 'General', url: '/settings/general'},
						{text: 'Navigation', url: '/settings/navigation'},
						{text: 'Collections', url: '/settings/collections'}
					]}
				]
			}
		]
	},
	config = require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	_ = require('underscore')
;
module.exports = {
	main: function(req, res) {
		for(var year = 1928; year <= 2013; year++){
			collections.dataSources.push({
				controller: 'seasons',
				url: 'http://www.transfermarkt.es/primera-division/gesamtspielplan/wettbewerb/ES1/saison_id/' + year,
				source: 'transfermarkt'
			});
		};

		db.getCollectionNames(function(err, collections){
			collections.forEach(function(collection){
				db.dropCollection(collection);
			});
		});

		setTimeout(function(){
			_.each(collections, function(docs, name){
				db.collection(name).insert(docs, function(){});
			});
		},2000);

		res.send('Database reset successfully.');
	}
};