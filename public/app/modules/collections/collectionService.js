var deps = [
	'jquery', 'underscore', 'backbone',	'./collectionModels',
];

define(deps, function($, _, Backbone, CollectionModels){
	"use strict";
	/**
	 * A collection endpoint allows to modify the documents in a given collection.
	 * It is possible to get the endpoint using the 'collection' method of the
	 * SollectionService.
	 * @param {String} collectionName The name of the collection to manipulate.
	 */
	var CollectionEndpoint = function(collectionName){
		this.collectionName = collectionName;
	};

	CollectionEndpoint.prototype = {
		/**
		 * Fetch a document from the server given its id
		 * @param  {String} id _id of the document
		 * @return {Promise}    A promise to be resolved with the document when it is
		 *                        fetched from the server.
		 */
		get: function(id){
			var doc = new CollectionModels.Document({_id: id}, {collectionName: this.collectionName}),
				deferred = $.Deferred()
			;

			doc.fetch()
				.then(function(){
					deferred.resolve(doc);
				})
				.fail(function(xhr, status, error){
					deferred.reject(error);
				})
			;

			return deferred.promise();
		},

		/**
		 * Get a blank document of the given the collectionName
		 * @param  {String} collectionName The name of the collection.
		 * @return {Document} A new document model (not stored)
		 */
		getNew: function(collectionName){
			return new CollectionModels.Document({}, {collectionName: this.collectionName});
		},

		/**
		 * Fetches document from the server that matches a query.
		 * @param  {Object|String} query  A MongoDB alike query or a string with tule
		 *                                format for query URLs.
		 * @param  {Object} modifiers Modifiers for the query. In a MongoDB way
		 *                            sort, limit and skip are allowed.
		 * @return {Promise}           A promise to be resolved when the documents are ready.
		 *                            The success callbacks will get a Query object as argument,
		 *                            with the documents in the results attribute.
		 */
		find: function(query, modifiers){
			var skipBuildQuery = _.isString(query),
				deferred = $.Deferred(),
				docQuery
			;

			if(skipBuildQuery){
				docQuery = new CollectionModels.Query({}, {collectionName: this.collectionName}),
				docQuery.queryURL = query;
			}
			else
				docQuery = new CollectionModels.Query(query, _.extend({}, (modifiers || {}), {collectionName: this.collectionName}));

			return docQuery.fetch(skipBuildQuery);
		},

		/**
		 * Save a document
		 * @param  {Document} doc The document to be stored in the server
		 * @return {Promise}     A promise to be resolved when the document is saved.
		 */
		save: function(doc){
			var deferred = $.Deferred();
			doc.save(null, {
				success: function(){
					deferred.resolve(doc);
				},
				error: function() {
					deferred.reject('There was a problem saving the document.');
				}
			});

			return deferred.promise();
		}
	};

	/**
	 * The collection service allows to access a CollectionEndpoint to fetch/save
	 * the collection's documents.
	 * @type {Object}
	 */
	var CollectionService = {

		/**
		 * Get a collection endpoint to work with the collection documents.
		 * @param  {String} collectionName Collection's name
		 * @return {CollectionEndpoint}		The endpoint for the given collection name.
		 */
		collection: function(collectionName){
			return new CollectionEndpoint(collectionName);
		},

		/**
		 * Get all the collection names in the server.
		 */
		getCollectionList: function(){
			var	deferred = $.Deferred();

			$.get('/api/collections', {}, function(data){
				deferred.resolve(data);
			}, 'json');

			return deferred.promise();
		}
	};

	return CollectionService;
});
