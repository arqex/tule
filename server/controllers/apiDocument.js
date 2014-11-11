'use strict';

var config = require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	queryParser = require( config.path.modules + '/db/queryParser'),
	log = require('winston'),
	settings = config.require('db').getInstance('settings').collection( config.tule.settingsCollection ),
	Q = require('q')
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

		id = queryParser.convertToDatatype(id, queryParser.guessDatatype(id));

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

		queryParser.getFieldDefinitions(collectionName)
			.then(function(definitions){
				doc = queryParser.updateQueryDatatypes(doc, definitions);
				createDocument(doc, collectionName, res);
			})
			.catch(function( error ){
					doc = queryParser.updateQueryDatatypes(doc, {});
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

		id = queryParser.convertToDatatype(id, queryParser.guessDatatype(id));

		if(id != doc._id)
			res.send(400, {error: 'Wrong id for the document.'});

		// It is not possible to update the id in MongoDB, so unset it.
		delete doc._id;

		queryParser.getFieldDefinitions(collectionName)
			.then(function(definitions){
				doc = queryParser.updateQueryDatatypes(doc, definitions);
				updateDocument(id, doc, collectionName, res);
			})
			.catch(function(error){
				doc = queryParser.updateQueryDatatypes(doc, {});
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

		id = queryParser.convertToDatatype(id, queryParser.guessDatatype(id));

		db.collection(collectionName).remove({_id: id}, function(err, removed){
				if(err){
					log.error( err );
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
			promises
		;

		if(!collectionName)
			return res.send(400, {error: 'No collection name given.'});

		promises = [
			queryParser.parseQuery(req.query, collectionName),
			Q.nfcall( settings.findOne.bind( settings, {name: 'collection_' + collectionName } ) )
		];

		db.getCollectionNames(function(err, names){
			if(err){
				log.error( err );
				return res.send(400, {error: 'Internal error.'});
			}

			if(names.indexOf(collectionName) == -1)
				return res.send(400, {error: 'Unknown collection ' + collectionName + '.'});

			Q.all(promises)
				.spread(function( queryOptions, collectionSettings ){
					var limit = typeof queryOptions.modifiers.limit  == 'undefined' ? 10 : queryOptions.modifiers.limit, // default value
						skip = queryOptions.modifiers.skip || 0,
						sort = queryOptions.modifiers.sort || { date: -1 },
						collection = db.collection(collectionName)
					;

					// Look for the sort property in the settings
					if( !queryOptions.modifiers.sort && collectionSettings ){
						if( collectionSettings.sortBy ) {
							sort = {};
							sort[ collectionSettings.sortBy ] = parseInt( collectionSettings.sortOrder, 10 ) || -1;
						}
					}

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
					res.send(400, {error: 'Malformed query: ' + err + '.'});
				})
			;
		});
	}
};

/* HELPER FUNCTIONS ++++++++++++++++++++++ */


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
