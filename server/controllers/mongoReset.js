'use strict';
var collections = {
		test: [
			{message: 'Message 1'},
			{message: 'Message 2'},
			{message: 'Message 3'},
			{message: 'Message 4'},
			{message: 'Message 5'}
		],
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
					{text: 'Config', url: '/config'}
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