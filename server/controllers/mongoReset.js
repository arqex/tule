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
				datatypes: ['array', 'boolean', 'float', 'integer', 'object', 'string', 'field'],
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
	mongojs = require('mongojs'),
	config = require('config'),
	_ = require('underscore')
;
module.exports = {
	main: function(req, res) {
		req.app.db.dropDatabase(config.dbName);
		req.app.db.close();
		req.app.db = mongojs(config.mongo);
		req.app.db.runCommand({ping:1}, function(err){
			//Die if mongo is not available
			if(err){
				res.send('Couldn\'t reset the database');
			}

			_.each(collections, function(docs, name){
				req.app.db.collection(name).insert(docs);
			});

			res.send('Database reset successfully.');
		});
	}
};