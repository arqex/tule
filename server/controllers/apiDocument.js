'use strict';

var url = require('url'),
	config = require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	mongojs = require('mongojs'),
	when = require('when'),
	queryTranslator = require(config.path.public + '/app/modules/collections/queryTranslator')
;

function checkPropertiesKeys(res, doc){
	for(var index in doc) {
		if(index[0] === '$')
			return res.send(400, {error: 'Type cannot start with $'});
		if(index.indexOf('.') != -1)
			return res.send(400, {error: 'Type cannot contain . (dots)'});
	}
}

function setHolder(comparison, holder, key, value){
	if(comparison == '$eq')
		holder[key] = value;
	else{
		holder[key] = {};
		holder[key][comparison] = value;
	}
	return holder;
};

function getDatatype(kindOf, value){
	if(kindOf === 'string')
		return value;
	if(kindOf === 'integer' || kindOf === 'float')
		return Number(value);
	if(kindOf === 'bool')
		return Boolean(value);
	if(kindOf === 'relation')
		return mongojs.ObjectId(value);
};

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

function convertToDatatype(value, datatype) {
	if(datatype == 'integer')
		return parseInt(value, 10);

	if(datatype == 'float')
		return parseFloat(value);

	if(datatype == 'string')
		return '' + value;

	return value;
}

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
 * Create a query for Tule db from a query string
 * @param  {String|Array} clauses String clauses in format "[or|and]|field|comparisonType|value
 * @param  {String} type    The collection name
 * @return {Object}         Query object ready to give to Tule's DB driver
 */
function createQuery(clauses, type){
	var query = {},
		holder = {},
		properties = {},
		deferred = when.defer()
	;

	if(!clauses || !clauses.length)
		return deferred.resolve(query);

	db.collection(config.mon.settingsCollection).findOne(
		{name: 'collection_' + type},
		function(err, collection){
			if(err)
				return res.send(400, {error: 'Internal error while fetching definitions'});

			if(collection != undefined)
				for(var definition in collection.propertyDefinitions)
					properties[collection.propertyDefinitions[definition].key] = collection.propertyDefinitions[definition];

			for(var i in clauses){
				var clause 		= clauses[i].split('|'),
					operator	= "$"+clause[0],
					key 		= decodeURI(clause[1]),
					comparison 	= "$"+clause[2],
					value		= decodeURI(clause[3])
				;

				if(properties[key])
					value = getDatatype(properties[key].datatype.id, value);

				//if value starts and ends with /, consider regex:
				if(typeof value === 'string' && value.length > 2 && value[0] == '/' && value[value.length - 1] == '/')
					value = new RegExp(value.slice(1,-1));

				if(operator != '$or')
					holder = setHolder(comparison, holder, key, value);
				else {
					if(!query['$or'])
						query[operator] = [];
					query[operator].push(holder);
					holder = {};
					holder = setHolder(comparison, holder, key, value);
				}
			}

			if(query['$or']) // Readable but not optimized
				query['$or'].push(holder);
			else
				query = holder;

			return deferred.resolve(query);
		}
	);
	return deferred.promise;
};

module.exports = {
	get: function(req, res){
		var id = req.params.id,
			type = req.params.type
		;
		if(!id)
			res.send(400, {error: 'No document id given.'});
		if(!type)
			res.send(400, {error: 'No document type given.'});

		db.collection(type).findOne(
			{_id: id},
			function(err, doc){
				if(!doc)
					res.send(404);
				else
					res.json(doc);
			}
		);
	},
	create: function(req, res){
		var type = req.params.type,
			doc = req.body
		;

		if(!type)
			res.send(400, {error: 'No type specified'});

		if(doc['_id'])
			return res.send(400, {error: 'Type _id is MongoDB reserved'});

		checkPropertiesKeys(res, doc);

		db.collection(type).insert(doc, function(err, newDoc){
			if(err)
				return res.send(400, {error: "Couldn't save doc properly."});
			res.json(newDoc[0]);
		});
	},

	update: function(req, res){
		var id = req.params.id,
			type = req.params.type,
			doc = req.body
		;
		if(!id)
			res.send(400, {error: 'No document id given.'});
		if(!type)
			res.send(400, {error: 'No document type given.'});

		checkPropertiesKeys(res, doc);

		if(id != doc._id)
			res.send(400, {error: 'Wrong id for the document.'});

		db.collection(type).save(doc, function(err, newDoc){
				if(err){
					console.log(err);
					res.send(400, {error: 'Internal Error'});
				}
				res.json(newDoc);
			}
		);
	},

	remove: function(req, res){
		var id = req.params.id,
			type = req.params.type
		;

		if(!id)
			res.send(400, {error: 'No document id given.'});
		if(!type)
			res.send(400, {error: 'No document type given.'});

		console.log('Removing ' + id);

		db.collection(type).remove({_id: id}, function(err){
				if(err){
					console.log(err);
					res.send(400, {error: 'Internal Error'});
				}
				console.log(arguments);
				res.send(200, {}); // Empty hash needed for trigger backbone's success callback
			}
		);
	},

	collection: function(req, res){
		var collectionName = req.params.type,
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

			queryPromise.then(function(queryOptions){
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
							current: Math.floor(skip/limit) + 1
						});
					});
				});
			});
		});
	}
}