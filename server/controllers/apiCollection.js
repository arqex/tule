'use strict';

var 	_ 		= require('underscore'),
	config 	= require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance()
;

var defaultSettings = {
		propertyDefinitions: [],
		headerFields: [],
		customProperties: true,
		mandatoryProperties: [],
		hiddenProperties: []
	},
	collectionPrefix = 'collection_'
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

	/**
	 * Controller for the route 'get::collections/:name'.
	 * Returns some stats from the given collection. At least the following attributes
	 * are returned in the response:
	 * 		ok: {boolean} whether the stats where fetched correctly. When false, it usually
	 * 			means that the collection doesn't exits.
	 *    count: The number of documents in the collection.
	 *    settings: The collection settings.
	 *
	 * @param  {http.ClientRequest} req The request
	 * @param  {http.ServerResponse} res The response
	 */
	getStatus: function(req, res){
		var collectionName = req.params.name,
			doc = req.body
		;
		if(!collectionName)
			res.send(400, {error: 'No collection name given.'});

		db.collection(config.tule.settingsCollection)
			.findOne({name: collectionPrefix + collectionName}, function(err, collectionSettings){
					if(err)
						return res.send(400, {error: 'There where an error fetching the collection settings.'});
					db.collection(collectionName).stats(function(err, stats){
						if(err) {
							// Check not found
							if(err == Object(err) && err.errmsg == 'ns not found')
								return res.send(404);
							console.log(err);
							return res.send(400, {error: 'There where an error fetching the collection stats: ' + err});
						}

						stats.settings = collectionSettings || {};
						if(!stats.count)
							stats.count = 0;

						res.json(stats);
					});
			})
		;
	},

	/**
	 * Controller for route 'post::collections'.
	 *
	 * Create a new collection with the settings sent in the request body. The collectionNAme
	 * will be used to create the 'name' property, by adding the prefix collectionPrefix to
	 * the original name. That name property will be used to fetch the settings from
	 * the settings collection.
	 *
	 * This controller returns the stored settings on success, and it will return success if the
	 * settings are saved, even thought if the collection already existed and it couldn't be
	 * created.
	 *
	 * @param  {http.ClientRequest} req The request
	 * @param  {http.ServerResponse} res The response
	 */
	create: function(req, res){
		var name = req.body.collectionName,
			doc	= req.body,
			properties = _.extend({}, defaultSettings, doc),
			errors = {},
			savedSettings = false
		;


		if(!name) {
			res.send(400, {error: 'No collection name given.'});
		}

		properties.name = collectionPrefix + name;

		// Create the collection
		db.createCollection(name, function(err, newDoc){
			if(err){
				console.log(err);
				errors.collection = err;
			}
			else {
				errors.collection = false;
			}

			if(typeof errors.settings != 'undefined') {
				resolveCollectionCreation(errors, savedSettings, res);
			}
		});

		// Create the settings
		db.collection(config.tule.settingsCollection).insert(properties, function(err, props){
			if(err){
				console.log(err);
				errors.collection = err;
			}
			else{
				errors.settings = false;
				savedSettings = props[0];
			}

			if(typeof errors.collection != 'undefined') {
				resolveCollectionCreation(errors, savedSettings, res);
			}
		});
	},

	/**
	 * Controller for the route 'put::collections/:name'.
	 * Updates the collection settings.
	 *
	 * @param  {http.ClientRequest} req The request
	 * @param  {http.ServerResponse} res The response
	 */
	update: function(req, res){
		var doc = req.body,
			collectionName = req.params.name,
			definitionsKeys = {},
			id
		;

		if(!collectionName) {
			res.send(400, {error: 'No collection name given.'});
		}

		if(collectionName != doc.collectionName) {
			res.send(400, {error: 'Collection name doesn\'t match with the route.'});
		}

		if(!doc._id) {
			res.send(400, {error: 'A _id attribute is needed to update the collection settings.'});
		}

		// Be sure the name is set
		doc.name = collectionPrefix + collectionName;

		// Remove the _id in order to update the document successfully
		id = doc._id;
		delete doc._id;

		console.log(doc);

		db.collection(config.tule.settingsCollection)
			.update({_id: id, name: collectionPrefix + collectionName}, doc, function(err, updated){
					if(err)
						return res.send(400, 'Error updating the collection settings: ' + err);

					if(!updated)
						return res.send(404);

					// Restore the id
					doc._id = id;
					res.json(doc);
			})
		;
	},

	/**
	 * Controller for the route 'delete::collections/:name'.
	 * Deletes a collection with all of its documents.
	 *
	 * @param  {http.ClientRequest} req The request
	 * @param  {http.ServerResponse} res The response
	 */
	remove: function(req, res) {
		var collectionName = req.params.name;

		if(!collectionName) {
			res.send(400, {error: 'No collection name given.'});
		}

		// Remove the settings. Don't care about the result.
		db.collection(config.tule.settingsCollection)
			.remove({name: collectionPrefix + collectionName}, function(){});

		// Drop the collection
		db.dropCollection(collectionName, function(err){
			if(err){
				// Check not found
				if(err == Object(err) && err.errmsg == 'ns not found')
					return res.send(404);
				return res.send(400, 'Error deleting the collection: ' + err);
			}
			res.send(200, {}); // Empty hash needed for trigger backbone's success callback
		});
	}

}

function resolveCollectionCreation(errors, doc, res) {
	if(errors.collection && errors.settings)
		return res.send(400, errors.collection + ' and ' + errors.settings);
	if(errors.settings)
		return res.send(400, errors.settings + '; But collection created successfully.');

	res.json(doc);
}
