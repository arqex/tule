'use strict';

var mongojs = require('mongojs'),
	url = require('url')
;

module.exports = {
	get: function(req, res){
		var id = req.params.id,
			type = req.params.type,
			collection
		;
		if(!id)
			res.send(400, {error: 'No document id given.'});
		if(!type)
			res.send(400, {error: 'No document type given.'});

		req.app.db.collection(type).findOne(
			{_id: mongojs.ObjectId(id)},
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
			res.send(400, {error: 'No document type given.'});

		req.app.db.collection(type).insert(doc, function(err, newDoc){
			res.json(newDoc);
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

		if(id != doc._id)
			res.send(400, {error: 'Wrong id for the document.'});

		doc._id = new mongojs.ObjectId(doc._id);

		req.app.db.collection(type).save(doc, function(err, newDoc){
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

		req.app.db.collection(type).remove(
			{_id: mongojs.ObjectId(id)},
			function(err){
				if(err){
					console.log(err);
					res.send(400, {error: 'Internal Error'});
				}
				res.send(200, {}); // Empty hash needed for trigger backbone's success callback
			}
		);
	},

	collection: function(req, res){
		var urlparts = url.parse(req.url, true),
			params = urlparts,
			type = req.params.type
		;

		if(!type)
			return res.send(400, {error: 'No collection type given.'});

		req.app.db.getCollectionNames(function(err, names){
			if(err){
				console.log(err);
				return res.send(400, {error: 'Internal error.'});
			}
			
			if(names.indexOf(type) == -1)
				return res.send(400, {error: 'Unknown collection type.'});

			var page = params.page || 1,
				pageSize = 20,
				collection = req.app.db.collection(type)
			;
			collection.runCommand('count', function(err, count){
				collection.find({}).limit(20, function(err, docs){
					res.json(docs);
				});
			});
		});
	}
}