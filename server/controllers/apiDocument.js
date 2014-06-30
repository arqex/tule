'use strict';

var url = require('url'),
	config = require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	mongojs = require('mongojs'),
	when = require('when')
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
		var type = req.params.type,
			//Let's be sure clauses are an array
			clauses = req.query && req.query.clause ? (typeof req.query.clause === 'string' ? [req.query.clause]: req.query.clause) : [],
			promise = createQuery(clauses, type)
		;

		if(!type)
			return res.send(400, {error: 'No collection type given.'});

		db.getCollectionNames(function(err, names){
			if(err){
				console.log(err);
				return res.send(400, {error: 'Internal error.'});
			}

			if(names.indexOf(type) == -1)
				return res.send(400, {error: 'Unknown collection type.'});

			var pageSize = req.query.limit || 10, // default value
				skip = req.query.skip || 0,
				collection = db.collection(type)
			;

			promise.then(function(query){
				collection.find(query, {limit: pageSize, skip: skip}, function(err, docs){
					collection.count(query, function(err, size){
						res.json({
							documents: docs,
							total: size,
							skip: skip,
							limit: pageSize,
							current: Math.floor(skip/pageSize) + 1
						});
					});
				});
			});
		});
	}
}