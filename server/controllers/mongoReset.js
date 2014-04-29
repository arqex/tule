'use strict';
var collections = {
		test: [
			{message: 'Message 01'},
			{message: 'Message 02'},
			{message: 'Message 03'},
			{message: 'Message 04'},
			{message: 'Message 05'},
			{message: 'Message 06'},
			{message: 'Message 07'},
			{message: 'Message 08'},
			{message: 'Message 09'},
			{message: 'Message 10'},
			{message: 'Message 11'},
			{message: 'Message 12'},
			{message: 'Message 13'},
			{message: 'Message 14'},
			{message: 'Message 15'},
			{message: 'Message 16'},
			{message: 'Message 17'},
			{message: 'Message 18'},
			{message: 'Message 19'},

			{message: 'Message 20'},
			{message: 'Message 21'},
			{message: 'Message 22'},
			{message: 'Message 23'},
			{message: 'Message 24'},
			{message: 'Message 25'},
			{message: 'Message 26'},
			{message: 'Message 27'},
			{message: 'Message 28'},
			{message: 'Message 29'},
			{message: 'Message 30'},
			{message: 'Message 31'},
			{message: 'Message 32'},
			{message: 'Message 33'},
			{message: 'Message 34'},
			{message: 'Message 35'},
			{message: 'Message 36'},
			{message: 'Message 37'},
			{message: 'Message 38'},
			{message: 'Message 39'},

			{message: 'Message 40'},
			{message: 'Message 41'},
			{message: 'Message 42'},
			{message: 'Message 43'},
			{message: 'Message 44'},
			{message: 'Message 45'},
			{message: 'Message 46'},
			{message: 'Message 47'},
			{message: 'Message 48'},
			{message: 'Message 49'},
			{message: 'Message 50'},
			{message: 'Message 51'},
			{message: 'Message 52'},
			{message: 'Message 53'},
			{message: 'Message 54'},
			{message: 'Message 55'},
			{message: 'Message 56'},
			{message: 'Message 57'},
			{message: 'Message 58'},
			{message: 'Message 59'},

			{message: 'Message 60'},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='},
			{message: 'Message ='}

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