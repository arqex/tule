'use strict';

var mongojs = require('mongojs'),
	_ 		= require('underscore'),
	config 	= require('config'),
	defaults = {
		fields: {},
		tableFields: []
	}
;

module.exports = {
	list: function(req, res){
		req.app.db.getCollectionNames(function(err, names){
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
	getConfig: function(req, res){				
		var db		= req.app.db,
			type 	= req.params.type
		;

		db.collection(config.mon.settingsCollection).findOne({type:type}, function(err, settings){
			if(err){
				console.log(err);
				return res.send(400, {error: 'Internal error.'});
			}

			if(!_.isObject(settings))
				return res.json(defaults);

			return res.json(_.extend({}, defaults, settings));
		});
	},

	updateConfig: function(req, res){
		var db 		= req.app.db,
			name 	= req.params.name,
			doc 	= req.body
		;

		// Creates object id
		doc['_id'] = new mongojs.ObjectId(doc['_id']);

		if(!name)
			res.send(400, {error: 'No document name given.'});

		if(name != doc.name) {
			res.send(400, {error: 'No name matches.'});
		}

		db.collection(config.mon.settingsCollection).save(doc, function(err, saved) {
		  if( err || !saved ) return res.send(400, {error: 'Internal error'});
		  return res.json(doc);
		});

	},

	createConfig: function(req, res){
		var name = req.params.name,
			doc = req.body
		;
		if(!name)
			res.send(400, {error: 'No document name given.'});

		doc.name = name;

		req.app.db.collection(config.mon.settingsCollection).insert(doc, function(err, newDoc){
			if(err){
				console.log(err);
				return res.send(400, {error: 'Internal error'});
			}
			res.json(newDoc);
		});
	},

	getStatus: function(req, res){
		var type = req.params.type,
			doc = req.body
		;
		if(!type)
			res.send(400, {error: 'No document type given.'});

		req.app.db.collection(type).insert(doc, function(err, newDoc){
			res.json(newDoc);
		});
	}
	
}