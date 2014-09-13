'use strict';

var config = require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	when = require('when'),
	queryTranslator = require(config.path.public + '/modules/collections/queryTranslator')
;

var queryParser = {

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
	parseQuery: function(urlArguments, collectionName){
		var me = this,
			query = {},
			deferred = when.defer()
		;

		// Try to parse the query string
		if(urlArguments.query){
			try {
				query = queryTranslator.toQuery(urlArguments.query);
			}
			catch (e) {
				deferred.reject(e);
				return deferred.promise;
			}
		}

		// If the query is empty, resolve it quickly
		if(!Object.keys(query).length){
			deferred.resolve( {query: query, modifiers: this.parseQueryModifiers(urlArguments)} );
			return deferred.promise;
		}


		// We have a query, update values depending on the datatype
		this.getFieldDefinitions(collectionName)
			.then(function(definitions){
				var queryData = {

					// Convert 'like' comparisons to regexp too
					query: me.resolveLike( me.updateQueryDatatypes(query, definitions) ),
					modifiers: me.parseQueryModifiers(urlArguments)
				};

				deferred.resolve(queryData);
			})
			.catch(function(error){
				deferred.reject(error);
			})
		;

		return deferred.promise;
	},

	resolveLike: function(query) {
		var value = false;

		for(var operator in query) {
			value = query[operator];

			// If the operator is 'like', transform
			if(operator === 'like'){
				query.$regex = this.likeToRegex(value);
				query.$options = 'im';
				delete query.like;
			}

			// If the value is an array, try to resolve every element
			else if (Object.prototype.toString.call( value ) === '[object Array]') {
				for (var i = 0; i < value.length; i++) {
					value[i] = this.resolveLike( value[i] );
				}
			}

			// If the value is an object, just resolve it
			else if (value === Object(value)) {
				query[operator] = this.resolveLike( value );
			}
		}

		return query;
	},

	/**
	 * Converts a like expresion to a regex. Basically, it escapes the string and
	 * uses the words to create an OR regexp.
	 *
	 * the words
	 * @param  {[type]} likeExpression [description]
	 * @return {[type]}                [description]
	 */
	likeToRegex: function( likeExpression ) {
		return String(likeExpression).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '|');
	},

	/**
	 * Parse the URL arguments to convert them to valid query modifiers to be used
	 * by the database.
	 *
	 * @param {Object} urlArguments The arguments given in the URL.
	 * @return {Object}					A valid modifiers object.
	 */
	parseQueryModifiers: function( urlArguments ) {
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
			}

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
	},

	/**
	 * Get the field definitions for a collection
	 *
	 * @param {String} collectionName Collection name
	 *
	 * @return A promise to be resolved when the field definitions of the collection
	 *                   are ready.
	 */
	getFieldDefinitions: function(collectionName) {
		var me = this,
			deferred = when.defer()
		;

		db.collection(config.tule.settingsCollection).findOne(
			{name: 'collection_' + collectionName},
			function(err, collection){
				var properties = {};

				if(err)
					return deferred.reject('Internal error while fetching definitions');

				if( collection )
					for(var definition in collection.propertyDefinitions)
						properties[collection.propertyDefinitions[definition].key] = collection.propertyDefinitions[definition];

				deferred.resolve(properties);
			}
		);

		return deferred.promise;
	},

	/**
	 * Update the values of a query to match the datatypes in the definitions, or guessing
	 * the datatype depending on the value format.
	 *
	 * @param {Object} query       MongoDB alike query
	 * @param {Object} definitions Field definitions with the datatypes
	 *
	 * @return {Object} query      MongoDB alike query with values' datatype updated.
	 */
	updateQueryDatatypes: function(query, definitions) {
		var updated = {},
			value, newValue, datatype, values
		;
		for(var field in query){
			value = query[field];

			// Logic clause, update all the inner clauses' datatypes
			if(field[0] == '$'){
				values = [];
				for (var i = 0; i < value.length; i++) {
					values.push( this.updateQueryDatatypes(value[i], definitions) );
				}
				updated[field] = values;
			}

			// A real document field
			else {

				// Comparison operator?
				if(value === Object(value)) {
					newValue = {};

					for(var key in value) {
						//Use the definition datatype or guess it
						datatype = definitions[field] ? definitions[field].datatype.id : this.guessDatatype(value[key]);
						newValue[key] = this.convertToDatatype( value[key], datatype );
					}

					updated[field] = newValue;
				}

				// Equals operator
				else {
					datatype = definitions[field] ? definitions[field].datatype.id : this.guessDatatype(value);
					updated[field] = this.convertToDatatype(value, datatype);
				}
			}
		}

		return updated;
	},

	/**
	 * Converts a value to a given datataype.
	 *
	 * @param {Mixed} value    The value to convert
	 * @param {String} datatype Datatype id.
	 * @return {Mixed} 				The converted value.
	 */
	convertToDatatype: function(value, datatype) {
		if(datatype == 'integer')
			return parseInt(value, 10);

		if(datatype == 'float')
			return parseFloat(value);

		if(datatype == 'string')
			return '' + value;

		if(datatype == 'date')
			return new Date(parseInt(value, 10));

		if(datatype == 'boolean')
			return !!value;

		return value;
	},

	/**
	 * Guess the datatype of a value. Parse numeric strings.
	 *
	 * @param {Mixed} value 	The value to guess the datatype.
	 * @return {String} 				Datatype id
	 */
	guessDatatype: function(value) {
		var val = parseInt(value, 10);
		if(value == val && ( !isNaN(val) )){
			if(Math.abs(val) > 100000000000)
				return 'date';

			return 'integer';
		}

		val = parseFloat(value);
		if(value == val && ( !isNaN(val) ))
			return 'float';

		if(value === Object(value))
			return 'object';

		if(value instanceof Array)
			return 'array';

		if(value === true || value === false)
			return 'boolean';

		return 'string';
	}
};

module.exports = queryParser;