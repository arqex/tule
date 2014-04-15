'use strict';

var mongojs = require('mongojs'),
	_ 		= require('underscore'),
	config 	= require('config'),
	defaults = {
		fields: {},
		tableFields: []
	},
	db = require(config.path.modules + '/db/dbManager').getInstance()
;

module.exports = {
	list: function(req, res){
		console.log(db);
		db.getCollectionNames(function(err, names){
			if(err){
				console.log(err);
				return res.send(400, {error: 'Internal error.'});
			}

			var collections = [];
			_.each(names, function(name){
				collections.push({type: name});
			});

			res.json(names);
		});
	},

	getStatus: function(req, res){
		var type = req.params.type,
			doc = req.body
		;
		if(!type)
			res.send(400, {error: 'No document type given.'});

		db.collection(type).insert(doc, function(err, newDoc){
			res.json(newDoc);
		});
	},

	createCollection: function(req, res){
		var name = req.body.name,
			doc	= req.body,
			properties = {
				"name" : "collection_" + name,
				"propertyDefinitions" : [ ],
				"mandatoryProperties" : [ ],
				"tableFields" : [ ]
			}
		;

		if(!name) {
			res.send(400, {error: 'No name specified'});
		} else {
			if(!name[0].match(/[a-z0-9_]/i))
				res.send(400, {error: 'Name has invalid characters or empty'});
			if(name.indexOf('$') != -1)
				res.send(400, {error: 'Name contains $ symbol'});
			if(name.indexOf(/\x00/) != -1)
				res.send(400, {error: 'Name contains some null character'});
			if(name.indexOf('system.') === 0)
				res.send(400, {error: 'Name starts with system. which is MongoDB reserved'});
		}

		db.createCollection(name, function(err, newDoc){
			if(err){
				console.log(err);
				return res.send(400, {error: 'Internal error while creating new collection'});
			}
			res.json(newDoc[0]);
		});

		db.collection(config.mon.settingsCollection).insert(properties, function(err, props){
			if(err){
				console.log(err);
				return res.send(400, {error: 'Internal error while setting properties'});
			}
			res.json(props[0]);
		});

	},

	updateCollection: function(req, res){
		var data = req.body.data,
			type = req.body.type,
			definitionsKeys = {}
		;

		db.collection(config.mon.settingsCollection).findOne(
			{name: 'collection_' + type},
			function(err, collection){
				if(err)
					return res.send(400, {error: 'Internal error while fetching definitions'});

				for(var definition in collection.propertyDefinitions){
					definitionsKeys[collection.propertyDefinitions[definition].key] = true;
				};

				for(var key in data){
					if(!definitionsKeys[key] && key != '_id'){
						var definition = data[key];
						delete definition['value'];
						collection.propertyDefinitions.push(definition);
					}
				};

				db.collection(config.mon.settingsCollection).save(collection, function(err, saved) {
					if( err || !saved ) 
						return res.send(400, {error: 'Internal error while saving definitions'});
					return res.send(200, {});
				});
		});
	}

}