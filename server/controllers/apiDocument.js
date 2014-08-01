'use strict';

var url = require('url'),
	config = require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	when = require('when'),
	queryTranslator = require(config.path.public + '/app/modules/collections/queryTranslator')
;

module.exports = {
	/**
	* Controller for get::docs/:collection/:id routes. Get a document
	* given the collectionName and the document _id.
	*
	* @param  {http.ClientRequest} req The request
	* @param  {http.ServerResponse} res The response
	* @return {undefined}    The method send a response using http.ServerResponse
	*/
	get: function(req, res){
		var id = req.params.id,
			collectionName = req.params.collection
		;
		if(!id)
			res.send(400, {error: 'No document id given.'});
		if(!collectionName)
			res.send(400, {error: 'No document type given.'});

		id = convertToDatatype(id, guessDatatype(id));

		db.collection(collectionName).findOne(
			{_id: id},
			function(err, doc){
				if(!doc)
					res.send(404);
				else
					res.json(doc);
			}
		);
	},

	/**
	* Controller for post::docs/:collection. Creates a new document for the given
	* collection.
	*
	* @param  {http.ClientRequest} req The request
	* @param  {http.ServerResponse} res The response
	* @return {undefined}    The method send a response using http.ServerResponse
	*/
	create: function(req, res){
		var collectionName = req.params.collection,
			doc = req.body
		;

		if(!collectionName){
			res.send(400, {error: 'No collection name specified'});
		}

		getFieldDefinitions(collectionName)
			.then(function(definitions){
				doc = updateQueryDatatypes(doc, definitions);
				createDocument(doc, collectionName, res);
			})
			.catch(function(error){
					doc = updateQueryDatatypes(doc, {});
					createDocument(doc, collectionName, res);
			})
		;
	},

	/**
	* Controller for route put::docs/:collection/:id. Updates a complete document.
	* Document _id must match the one in the route, and the old document will be
	* replaced with the new one.
	*
	* @param  {http.ClientRequest} req The request
	* @param  {http.ServerResponse} res The response
	* @return {undefined}    The method send a response using http.ServerResponse
	*/
	update: function(req, res){
		var id = req.params.id,
			collectionName = req.params.collection,
			doc = req.body
		;
		if(!id)
			res.send(400, {error: 'No document id given.'});
		if(!collectionName)
			res.send(400, {error: 'No document collectionName given.'});

		id = convertToDatatype(id, guessDatatype(id));

		if(id != doc._id)
			res.send(400, {error: 'Wrong id for the document.'});

		// It is not possible to update the id in MongoDB, so unset it.
		delete doc['_id'];

		getFieldDefinitions(collectionName)
			.then(function(definitions){
				doc = updateQueryDatatypes(doc, definitions);
				updateDocument(id, doc, collectionName, res);
			})
			.catch(function(error){
				doc = updateQueryDatatypes(doc, {});
				updateDocument(id, doc, collectionName, res);
			})
		;
	},

	/**
	* Controller for the route delete::docs/:collection/:id. Removes a document
	* from the database given its id.
	*
	* @param  {http.ClientRequest} req The request
	* @param  {http.ServerResponse} res The response
	* @return {undefined}    The method send a response using http.ServerResponse
	*/
	remove: function(req, res){
		var id = req.params.id,
			collectionName = req.params.collection
		;

		if(!id)
			res.send(400, {error: 'No document id given.'});
		if(!collectionName)
			res.send(400, {error: 'No document collectionName given.'});

		id = convertToDatatype(id, guessDatatype(id));

		db.collection(collectionName).remove({_id: id}, function(err, removed){
				if(err){
					console.log(err);
					res.send(400, {error: 'Internal Error'});
				}

				if(!removed)
					res.send(404);

				res.send(200, {}); // Empty hash needed for trigger backbone's success callback
			}
		);
	},

	/**
	* Controller for the route get::docs/:collection.
	* Search for documents in the server that matches a query passed as URL arguments.
	* The url accepts the following parameters:
	*
	* query: Specify what documents are being searched. It is possible to compare
	* 		fields to value using clauses with the notation 'field|operator|value', where accepted
	* 		operators are eq, gt, gte, lt, lte. If more than one clauses are needed
	* 		for the search, logical operations are allowed using the notation
	* 		'logical_operator(clause,clause....)'. Valid logical operators are and, or,
	* 		nor, not. Example 'query=or(age|eq|10, age|gte|30)' search for documents with
	* 		age 10 or greater than 30, 30 included.
	*
	* limit: Number of documents to be returned. 0 return all the documents found. Default is 10.
	*
	* skip: Number of documents to skip before returning the first one. Useful for pagination.
	* 		Default is 0.
	*
	* sort: Specify the order of the returned documents. It is possible to sort the documents
	* 		using their fields. If the field is preceeded by a '-' sign, the documents will be
	* 		sorted by that field in a descending order. It is possible to use multiple fields
	* 		to sort separating them by commas.
	* 		Example: 'sort=name,-age' would sort the documents first by name, ascending, and if there
	* 			are documents with the same name, they will be sorted by age descending.
	*
	* @param  {http.ClientRequest} req The request
	* @param  {http.ServerResponse} res The response
	* @return {undefined}    The method send a response using http.ServerResponse
	*/
	collection: function(req, res){
		var collectionName = req.params.collection,
			queryPromise
		;

		if(!collectionName)
			return res.send(400, {error: 'No collection name given.'});

		queryPromise = parseQuery(req.query);

		db.getCollectionNames(function(err, names){
			if(err){
				console.log(err);
				return res.send(400, {error: 'Internal error.'});
			}

			if(names.indexOf(collectionName) == -1)
				return res.send(400, {error: 'Unknown collection ' + collectionName + '.'});

			queryPromise
				.then(function(queryOptions){
					var limit = queryOptions.modifiers.limit || 10, // default value
						skip = queryOptions.modifiers.skip || 0,
						sort = queryOptions.modifiers.sort || {},
						collection = db.collection(collectionName)
					;

					collection.find(queryOptions.query, {limit: limit, sort: sort, skip: skip}, function(err, docs){
						collection.count(queryOptions.query, function(err, size){
							res.json({
								documents: docs,
								total: size,
								skip: skip,
								limit: limit,
								sort: sort,
								current: Math.floor(skip/limit) + 1,
								query: queryOptions.query
							});
						});
					});
				})
				.catch(function(err){
					res.send(400, {error: 'Malformed query: ' + err + '.'})
				})
			;
		});
	}
}

/* HELPER FUNCTIONS ++++++++++++++++++++++ */



/**
 * Parse the arguments given by the URL creating a valid query to be used by the database
 * to search for documents.
 *
 * @param {Object} urlArguments   Url arguments
 * @param {String} collectionName Collection name to parse field datatypes.
 *
 * @return {Promise} 			A promise to be resolved when the query is ready. The promise
 *                        will be resolved with an object {query, modifiers}.
 */
function parseQuery(urlArguments, collectionName){
	var query = {},
		deferred = when.defer()
	;

	// Try to parse the query string
	if(urlArguments.query){
		try {
			query = queryTranslator.toQuery(urlArguments.query)
		}
		catch (e) {
			deferred.reject(e);
			return deferred.promise;
		}
	}

	// If the query is empty, resolve it quickly
	if(!Object.keys(query).length){
		deferred.resolve({query: query, modifiers: parseQueryModifiers(urlArguments)});
		return deferred.promise;
	}

	// We have a query, update values depending on the datatype
	getFieldDefinitions(collectionName)
		.then(function(definitions){
			deferred.resolve({
				query: updateQueryDatatypes(query, definitions),
				modifiers: parseQueryModifiers(urlArguments)
			});
		})
		.catch(function(error){
			deferred.reject(error);
		})
	;

	return deferred.promise;
}

/**
 * Parse the URL arguments to convert them to valid query modifiers to be used
 * by the database.
 *
 * @param {Object} urlArguments The arguments given in the URL.
 * @return {Object}					A valid modifiers object.
 */
function parseQueryModifiers(urlArguments) {
	var modifiers = {};

	// Parse sort modifier
	if(urlArguments.sort){
		var fields = urlArguments.sort.split(','),
			sort = {}
		;
		for (var i = 0; i < fields.length; i++) {
			var field = fields[i];
			if(field[0] === '-')
				sort[decodeURIComponent(field.substring(1))] = -1;
			else
				sort[decodeURIComponent(field)] = 1;
		};

		modifiers.sort = sort;
	}

	// Parse limit modifier
	if(typeof urlArguments.limit != 'undefined'){
		modifiers.limit = parseInt(urlArguments.limit, 10);
	}

	// Parse skip modifier
	if(typeof urlArguments.skip != 'undefined'){
		modifiers.skip = parseInt(urlArguments.skip, 10);
	}

	return modifiers;
}

/**
 * Get the field definitions for a collection
 *
 * @param {String} collectionName Collection name
 *
 * @return A promise to be resolved when the field definitions of the collection
 *                   are ready.
 */
function getFieldDefinitions(collectionName) {
	var me = this,
		deferred = when.defer()
	;

	db.collection(config.mon.settingsCollection).findOne(
		{name: 'collection_' + collectionName},
		function(err, collection){
			var properties = {};

			if(err)
				return deferred.reject('Internal error while fetching definitions');

			if(collection != undefined)
				for(var definition in collection.propertyDefinitions)
					properties[collection.propertyDefinitions[definition].key] = collection.propertyDefinitions[definition];

			deferred.resolve(properties);
		}
	);

	return deferred.promise;
}

/**
 * Update the values of a query to match the datatypes in the definitions, or guessing
 * the datatype depending on the value format.
 *
 * @param {Object} query       MongoDB alike query
 * @param {Object} definitions Field definitions with the datatypes
 *
 * @return {Object} query      MongoDB alike query with values' datatype updated.
 */
function updateQueryDatatypes(query, definitions) {
	var updated = {},
		value, newValue, keys, datatype, values
	;
	for(var field in query){
		value = query[field];

		// Logic clause, update all the inner clauses' datatypes
		if(field[0] == '$'){
			values = [];
			for (var i = 0; i < value.length; i++) {
				values.push(updateQueryDatatypes(value[i], definitions));
			};
			updated[field] = values;
		}

		// A real document field
		else {

			// Comparison operator?
			if(value === Object(value)) {
				keys = Object.keys(value);
				newValue = {};

				//Use the definition datatype or guess it
				datatype = definitions[field] ? definitions[field].datatype.id : guessDatatype(value[keys[0]]);

				newValue[keys[0]] = convertToDatatype(value[keys[0]], datatype);

				updated[field] = newValue;
			}

			// Equals operator
			else {
				datatype = definitions[field] ? definitions[field].datatype.id : guessDatatype(value);
				updated[field] = convertToDatatype(value, datatype);
			}
		}
	}

	return updated;
}

/**
 * Converts a value to a given datataype.
 *
 * @param {Mixed} value    The value to convert
 * @param {String} datatype Datatype id.
 * @return {Mixed} 				The converted value.
 */
function convertToDatatype(value, datatype) {
	if(datatype == 'integer')
		return parseInt(value, 10);

	if(datatype == 'float')
		return parseFloat(value);

	if(datatype == 'string')
		return '' + value;

	return value;
}

/**
 * Guess the datatype of a value. Parse numeric strings.
 *
 * @param {Mixed} value 	The value to guess the datatype.
* @return {String} 				Datatype id
 */
function guessDatatype(value) {
	if(value == parseInt(value, 10))
		return 'integer';
	if(value == parseFloat(value))
		return 'float';
	if(value === Object(value))
		return 'object';
	if(value instanceof Array)
		return 'array';

	return 'string';
}

/**
 * Creates a document sending the result as a response to the client.
 *
 * @param {Object} doc            Document data
 * @param {String} collectionName The collection name
 * @param {http.ServerResponse} res  The response object to send to the client.
 */
function createDocument(doc, collectionName, res) {
	db.collection(collectionName).insert(doc, function(err, newDoc){
		if(err){
			return res.send(400, {error: "Couldn't save doc properly: " + err});
		}
		res.json(newDoc[0]);
	});
}


/**
* Updates a document sending the result as a response to the client.
*
* @param {Object} doc            Document data
* @param {String} collectionName The collection name
* @param {http.ServerResponse} res  The response object to send to the client.
*/
function updateDocument(id, doc, collectionName, res) {
	db.collection(collectionName).update({_id: id}, doc, function(err, updated){
		if(err){
			res.send(400, {error: 'Internal Error: ' + err});
		}

		if(!updated)
			res.send(404);

		// Restore the id
		doc._id = id;
		res.json(doc);
	});
}
