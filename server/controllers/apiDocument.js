'use strict';

var mongojs = require('mongojs'),
	url = require('url')
;

function checkPropertiesKeys (res, doc){
	for(var index in doc) { 
        if(index[0] === '$')
        	return res.send(400, {error: 'Type cannot start with $'});
        if(index.indexOf('.') != -1)
        	return res.send(400, {error: 'Type cannot contain . (dots)'});
   	}
};

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
            res.send(400, {error: 'No type specified'});

        if(doc['_id'])
            return res.send(400, {error: 'Type _id is MongoDB reserved'});
        
        checkPropertiesKeys(res, doc);

		req.app.db.collection(type).insert(doc, function(err, newDoc){
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