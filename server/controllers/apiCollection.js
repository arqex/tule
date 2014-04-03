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
            doc  = req.body,
            properties = {
				"name" : "collection_" + name,
				"propertyDefinitions" : [ ],
				"mandatoryProperties" : [ ],
				"tableFields" : [ ]
			}
        ;
        if(!name)
            res.send(400, {error: 'No document name given.'});

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

    }

}