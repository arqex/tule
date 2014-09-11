'use strict';

var _ = require('underscore'),
	config = require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	settingsDb = require(config.path.modules + '/db/dbManager').getInstance('settings'),
	when = require('when'),
	log = require('winston')
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
		db.getCollectionNames(function(err, names){
			if(err){
				log.error( err );
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
	getStats: function(req, res){
		var collectionName = req.params.name,
			doc = req.body
		;
		if(!collectionName)
			res.send(400, {error: 'No collection name given.'});

		settingsDb.collection(config.tule.settingsCollection)
			.findOne({name: collectionPrefix + collectionName}, function(err, collectionSettings){
					if(err)
						return res.send(400, {error: 'There where an error fetching the collection settings.'});
					db.collection(collectionName).stats(function(err, stats){
						if(err) {
							// Check not found
							if(err == Object(err) && err.errmsg == 'ns not found')
								return res.send(404);
							log.error( err );
							return res.send(400, {error: 'There where an error fetching the collection stats: ' + err});
						}

						if(collectionSettings){
							stats.settings = _.extend({}, defaultSettings, collectionSettings);
							if(!stats.count)
								stats.count = 0;

							res.json(stats);
						}
						else{
							guessPropertyDefinitions(collectionName, function(definitions){

								// If there are no settings, get the defaults and guess the definitions
								stats.settings = _.extend(
									{collectionName: collectionName, name: collectionPrefix + collectionName},
									defaultSettings,
									{propertyDefinitions:  definitions}
								);

								if(!stats.count)
									stats.count = 0;

								res.json(stats);
							});
						}
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
				log.error( err );
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
		settingsDb.collection(config.tule.settingsCollection).insert(properties, function(err, props){
			if(err){
				log.error( err );
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

		settingsDb.collection(config.tule.settingsCollection)
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
		settingsDb.collection(config.tule.settingsCollection)
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


// HELPER FUNCTIONS


/**
 * Check errors in the collection creation process and send the response
 * to the client.
 *
 * @param  {Object} errors Object with errors for the collection and setting creation
 *                         process.
 * @param  {Object} doc    The settings object.
 * @param  {HttpClentResponse} res    The response to be sent to the client.
 */
function resolveCollectionCreation(errors, doc, res) {
	if(errors.collection && errors.settings)
		return res.send(400, errors.collection + ' and ' + errors.settings);
	if(errors.settings)
		return res.send(400, errors.settings + '; But collection created successfully.');

	res.json(doc);
}

/**
 * This method is called when there is a collection without settings.
 * It goes through a document of the collection and create a field definition
 * for every document field, depending of its value format.
 *
 * @param  {String} collectionName The collection name
 * @param  {Function} clbk         The callback to be called with the definitions as
 *                                 argument when they are ready.
 */
function guessPropertyDefinitions(collectionName, clbk) {
	var definitions = [];

	// Fetch a document to guess the fields
	db.collection(collectionName).findOne({}, function(err, doc){

		//
		if(err || !doc)
			return clbk([]);

		var type = false;
		for(var key in doc){
			if(key != '_id'){
				type = guessDataType(doc[key]);
				if(type){
					definitions.push({key: key, label: '', datatype: {id: type, options:{}}});
				}
			}
		}

		// Try to guess the relations
		guessRelations(definitions)
			.then(function(relDefinitions){
				clbk(relDefinitions);
			})
			.catch(function() {

				// Remove related fields
				for (var i = definitions.length - 1; i >= 0; i--) {
					definitions.splice(i, 1);
				};

				clbk(definitions);
			})
		;
	});
}

/**
 * Given a definition array, take the fields with datatype 'relation' and look for
 * related collections in the current database comparing the name of fields and collections.
 * If the method can't find a related collection, remove the definition from the output
 * definition array.
 *
 * @param  {Array} definitions     Field definitions
 * @param  {Array} collectionNames The names of the collections in the database
 * @return {Promise}               A promise to be resolved with the definitions after
 *                                   the relation guessing.
 */
function guessRelations(definitions, collectionNames) {
	var relDefinitions = [],
		promises = [],
		deferred = when.defer()
	;

	// Fetch all the collection names
	db.getCollectionNames(function(err, names){

		for (var i = 0; i < definitions.length; i++) {
			var def = definitions[i];
			if(def.datatype.id == 'relation'){

				// Add the relation promise
				promises.push(guessRelation(def, names));
			}
			else {
				relDefinitions.push(def);
			}
		};

		// If we don't have promises resolve now
		if(!promises.length)
			deferred.resolve(relDefinitions);
		else {

			// Wait for all the promises to finish
			when.settle(promises)
				.then(function(descriptors){

					descriptors.forEach(function(d){

						// Only if we found a relation, add it to the definition
						if(d.state == 'fulfilled'){

							relDefinitions.push(d.value);
						}
					});

					deferred.resolve(relDefinitions);
				})
				.catch(function(){
					// We couldn't find any relation, all the promises failed,
					// just resolve
					deferred.resolve(relDefinitions);
				})
			;
		}

	});

	return deferred.promise;
}

/**
 * Guess the related collection and the display field for a relation field definition.
 *
 * @param  {Object} definition      A relation field definition
 * @param  {Array} collectionNames All the collection names of the current database.
 * @return {Promise}                 A promise to be resolved with the updated definition
 *                                     after the relation guessing.
 */
function guessRelation(definition, collectionNames) {
	var found = false,
		i = 0,
		deferred = when.defer(),
		key = definition.key.toLowerCase(),
		collection
	;

	// Try to find the name of the collection in the field key
	while(i<collectionNames.length && !found) {
		collection = collectionNames[i].toLowerCase();

		if(key.indexOf(collection) != -1)
			found = collection;

		// Look up for plurals
		if(!found && collection[collection.length - 1] == 's'){
			if(key.indexOf(collection.substring(0, collection.length - 1)) != -1)
				found = collection;
			if(!found && collection[collection.length - 2] == 'e') {
				if(key.indexOf(collection.substring(0, collection.length - 2)) != -1)
					found = collection;
			}
		}

		i++;
	}

	// No related collection found, fail.
	if(!found)
		deferred.reject();
	else {

		// We got the related collection, look for a field
		db.collection(found).findOne({}, function(err, doc) {
			var displayField,
				keys
			;

			// We don't have docs, fail
			if(err || !doc)
				return deferred.reject();

			// Name & title are nice fields to show. If the document
			// doesn't have them, any field but _id are good.
			if(doc.name)
				displayField = 'name';
			else if(doc.title)
				displayField = 'title';
			else {
				keys = Object.keys(doc);
				if(keys[0] != '_id')
					displayField = keys[0]
				else if(keys.length > 1)
					displayField = keys[1]
				else
					return deferred.reject();
			}

			definition.datatype.options = {
				relatedCollection: found,
				displayField: displayField
			}

			return deferred.resolve(definition);
		});
	}

	return deferred.promise;
}

/**
 * Guess the datatype of a database value.
 *
 * @param  {Mixed} value A value to guess its datatype
 * @return {String}       Datatype id or false if it wasn't possible to
 *                                 guess a datatype.
 */
function guessDataType(value) {
	if(_.isString(value)){
		// If matches MongoDB ObjectID format is a relation.
		if(value.match(/^[0-9a-f]{24}$/))
			return 'relation';

		return 'string';
	}

	// If we are using mongo, check for ObjectID
	if(db.mongo && value instanceof db.mongo.ObjectID)
		return 'relation';

	if(value == parseInt(value, 10) && !isNaN(value))
		return 'integer';

	if(_.isDate(value))
		return 'date';

	if(_.isObject(value)){
		if(Object.keys(value).length == 2 && value.id && value.displayField)
			return 'relation';

		return 'object';
	}

	if(_.isArray(value))
		return 'array';

	if(_.isBoolean(value))
		return 'bool';


	if(value == parseFloat(value))
		return 'float';

	return false;
}
