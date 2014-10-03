define(['jquery', 'underscore', 'backbone', './queryTranslator'], function($, _, Backbone, queryTranslator){
	"use strict";

	var Document = Backbone.Model.extend({
		idAttribute: '_id',
		initialize: function(attrs, opts){
			this.collectionName = opts.collectionName;
		},
		urlRoot: function(){
			return this.apiUrl + '/docs/' + this.collectionName;
		}
	});

	var Collection = Backbone.Collection.extend({
		model: Document,
		initialize: function(docs, options){
			var me = this;
			this.collectionName 	= options.collectionName;
			this.url = this.apiUrl + '/docs/' + this.collectionName;
			this.each(function(model){
				model.collectionName = me.collectionName;
			});
		}
	});

	/**
	 * The query object is the one used to make complex queries to the server
	 * it accepts a query in MongoDB format and once you call its fetch method
	 * the documents found are available in the results attribute.
	 *
	 * @param {Object} query   A MongoDB alike query object.
	 * @param {Object} options Query modifiers, like sort, limit, skip, and collectionName
	 */
	var Query = function(query, options){
		this.collectionName = options.collectionName;
		this.url = this.apiUrl + '/docs/' + this.collectionName;
		this.query = query;
		this.modifiers = this.parseModifiers(options);
		this.results = new Collection([], {collectionName: this.collectionName});
	};

	Query.prototype = {

		/**
		 * Accepted modifierts to be sent to the server.
		 */
		validModifiers: ['sort', 'skip', 'limit'],

		/**
		 * Fetch the documents that matches the query from the server.
		 *
		 * @param  {bool} skipBuildQuery If true, the query URL won't be build in the
		 *                               fetch method, and the existing queryURL attribute
		 *                               will be used.
		 * @return {Promise}         A promise to be resolved with the query when the
		 *                             documents are fetched.
		 */
		fetch: function(queryURL){
			var me = this,
				deferred = $.Deferred()
			;

			// Create the query URL
			if(!queryURL)
				this.queryURL = this.buildUrlQuery();
			else
				this.queryURL = this.normalizeQueryURL(queryURL);

			this.fetching = $.get(this.url, this.queryURL)
				.done(function(response){
					console.log(response);

					me.results = new Collection(response.documents, {collectionName: me.collectionName});
					me.documentCount = response.total;

					me.query = response.query;
					me.modifiers = {
						skip: response.skip,
						limit: response.limit,
						sort: response.sort
					};

					deferred.resolve(me);
				})
				.fail(function(response, status, error){
					deferred.reject(error, me);
				})
			;

			return deferred.promise();
		},

		parseModifiers: function(options){
			var modifiers = {};
			for (var i = 0; i < this.validModifiers.length; i++) {
				var modifier = this.validModifiers[i];
				if( 'undefined' != typeof options[modifier] )
					modifiers[modifier] = options[modifier];
			}

			return modifiers;
		},

		buildUrlQuery: function(query, modifiers){
			query = query || this.query;

			var url = queryTranslator.toString(query),
				modifiers = this.buildModifierUrlQuery(modifiers)
			;

			if(url.length){
				url = 'query=' + url;
			}

			if(modifiers){
				if(url.length){
					url += '&';
				}
				url += modifiers;
			}

			return url;
		},

		buildModifierUrlQuery: function(modifiers){
			modifiers = modifiers || this.modifiers;
			var urlParts = [],
				part
			;

			if(modifiers.sort){
				part = [];
				_.each(modifiers.sort, function(order, field){
					if(order == -1)
						part.push('-'+ encodeURIComponent(field));
					else if(order == 1)
						part.push(encodeURIComponent(field));
				});

				if(part.length){
					urlParts.push('sort=' + part.join(','));
				}
			}

			if( 'undefined' != typeof modifiers.limit ){
				urlParts.push('limit=' + modifiers.limit);
			}

			if(typeof modifiers.skip != 'undefined')
				urlParts.push('skip=' + modifiers.skip);

			if(!urlParts.length)
				return '';

			return urlParts.join('&');
		},

		normalizeQueryURL: function(urlArgs) {
			var me = this,
				argsStr = urlArgs.split('&'),
				validArgs = ['query', 'sort', 'limit', 'skip'],
				args = {},
				normalized = []
			;

			_.each(argsStr, function(arg){
				var argParts = arg.split('=');
				if(argParts.length == 2)
					args[argParts[0]] = argParts[1];
			});

			_.each(validArgs, function(argName) {
				if(args[argName])
					normalized.push(argName + '=' + args[argName]);
				else if(me.modifiers[argName])
					normalized.push(argName + '=' + me.modifiers[argName]);
			});

			return normalized.join('&');
		}
	};

	return {
		init: function( apiUrl ){
			Document.prototype.apiUrl = apiUrl;
			Collection.prototype.apiUrl = apiUrl;
			Query.prototype.apiUrl = apiUrl;
		},
		Document: Document,
		Collection: Collection,
		Query: Query
	};

});
