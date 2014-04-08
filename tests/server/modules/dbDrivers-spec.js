var path = require('path'),
	when = require('when'),
	config = require('config'),
	db = require(path.join(__dirname, '../../..', 'server/modules/db/mongoDriver')),
	promise
;

console.log('DB');
console.log(db.init);
config.mongo = 'mongodb://localhost:27017/tule';
promise = db.init();

describe('Driver API', function() {
	var cname = 'testCollectionName',
		collectionCount, driver, collection, savedDoc
	;

	it('getCollectionNames()', function(done){
		promise.then(function(d){
			driver = d;
			driver.getCollectionNames(function(err, names){
				expect(err).toBeNull();
				collectionCount = names.length;
				done();
			});
		}).catch(function(err){
			console.log('ERRROR GORDO: ' + err);
			done();
		});
	});

	it("createCollection()", function(done){
		driver.createCollection(cname, function(err){
			expect(err).toBeNull();
			driver.getCollectionNames(function(err, names){
				var index = names.indexOf(cname);
				expect(names.length).toBe(collectionCount + 1);
				expect(index).not.toBe(-1);
				done();
			});
		})
	});

	it("collection()", function(){
		collection = driver.collection(cname);
		expect(typeof collection.find).toEqual('function');
		expect(typeof collection.findOne).toEqual('function');
		expect(typeof collection.insert).toEqual('function');
		expect(typeof collection.update).toEqual('function');
		expect(typeof collection.save).toEqual('function');
		expect(typeof collection.remove).toEqual('function');
		expect(typeof collection.count).toEqual('function');
	});

	it("collection.count()", function(done){
		collection.count(function(err, count){
			expect(count).toBe(0);
			done();
		});
	});

	it("single collection.insert()", function(done){
		collection.insert({msg: 'hello', integer: 0}, function(err, docs){
			collection.count(function(err, count){
				expect(count).toBe(1);
				done();
			});
		});
	});


	it("multiple collection.insert()", function(done){
		collection.insert([{msg: 'hello', integer: 1}, {msg: 'tule', integer: 2},{msg: 'great', integer: 3}], function(err, docs){
			collection.count(function(err, count){
				expect(count).toBe(4);
				done();
			});
		});
	});

	it("find({})", function(done){
		collection.find({}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(4);
			done();
		});
	});

	it("find({msg: 'hello'}) expect 2 documents", function(done){
		collection.find({msg: 'hello'}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(2);
			done();
		});
	});

	it("collection.count({msg: 'hello'})", function(done){
		collection.count({msg: 'hello'}, function(err, count){
			expect(count).toBe(2);
			done();
		});
	});

	it("find({msg: 'bye'}) expect 0 documents", function(done){
		collection.find({msg: 'bye'}, function(err, docs){
			if(err)
				console.log(err);
			expect(err).toBeNull();
			expect(docs.length).toBe(0);
			done();
		});
	});

	it("find({msg: 'hello', integer: 1}) expect 1 document", function(done){
		collection.find({msg: 'hello', integer: 1}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(1);
			done();
		});
	});

	it("find({msg: 'tule'}) expect integer = 2", function(done){
		collection.find({msg: 'tule'}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs[0].integer).toBe(2);
			done();
		});
	});

	it("find({integer: {$gt: 1}}) expect 2 documents", function(done){
		collection.find({integer: {$gt: 1}}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(2);
			done();
		});
	});

	it("find({integer: {$gte: 1}}) expect 3 documents", function(done){
		collection.find({integer: {$gte: 1}}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(3);
			done();
		});
	});

	it("find({integer: {$gte: 1.5}}) expect 2 documents", function(done){
		collection.find({integer: {$gte: 1.5}}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(2);
			done();
		});
	});

	it("find({integer: {$lt: 1}}) expect 1 document1", function(done){
		collection.find({integer: {$lt: 1}}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(1);
			done();
		});
	});

	it("find({integer: {$gte: 1}}) expect 2 documents", function(done){
		collection.find({integer: {$lte: 1}}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(2);
			done();
		});
	});

	it("find({msg: {$ne: 'hello'}}) expect 2 documents", function(done){
		collection.find({msg: {$ne: 'hello'}}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(2);
			done();
		});
	});

	it("find({msg: {$in: ['hello', 'great']}}) expect 3 documents", function(done){
		collection.find({msg: {$in: ['hello', 'great']}}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(3);
			done();
		});
	});

	it("find({msg: {$nin: ['tule', 'great']}}) expect 2 documents", function(done){
		collection.find({msg: {$nin: ['tule', 'great']}}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(2);
			done();
		});
	});

	it("find({$or:[{msg: 'hello'}, {integer: 3}]}) expect 3 documents", function(done){
		collection.find({$or:[{msg: 'hello'}, {integer: 3}]}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(3);
			done();
		});
	});

	it("find({$and:[{msg: 'hello'}, {integer: 1}]}) expect 1 documents", function(done){
		collection.find({$and:[{msg: 'hello'}, {integer: 1}]}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(1);
			done();
		});
	});

	it("find({$nor:[{msg: 'hello'}, {integer: 1}]}) expect 2 documents", function(done){
		collection.find({$nor:[{msg: 'hello'}, {integer: 1}]}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(2);
			done();
		});
	});

	it("find({integer: {$not: {$lt:1}}}) expect 3 documents", function(done){
		collection.find({integer: {$not: {$lt:1}}}, function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(3);
			done();
		});
	});

	it("find({msg:'hello'}, {sort:{integer: -1}})", function(done){
		collection.find({msg:'hello'}, {sort:{integer: -1}},  function(err, docs){
			if(err)
				console.log(err);
			expect(docs[0].integer).toBe(1);
			expect(docs[1].integer).toBe(0);
			done();
		});
	});

	it("find({msg:'hello'}, {sort:{integer: 1}})", function(done){
		collection.find({msg:'hello'}, {sort:{integer: 1}},  function(err, docs){
			if(err)
				console.log(err);
			expect(docs[0].integer).toBe(0);
			expect(docs[1].integer).toBe(1);
			done();
		});
	});

	it("find({}, {sort:{integer: -1}})", function(done){
		collection.find({}, {sort:{integer: -1}},  function(err, docs){
			if(err)
				console.log(err);
			expect(docs[0].msg).toBe('great');
			expect(docs[1].msg).toBe('tule');
			expect(docs[2].integer).toBe(1);
			expect(docs[3].integer).toBe(0);
			done();
		});
	});

	it("find({}, {sort:{integer: -1}, skip: 1}})", function(done){
		collection.find({}, {sort:{integer: -1}, skip: 1},  function(err, docs){
			if(err)
				console.log(err);
			expect(docs[0].msg).toBe('tule');
			expect(docs[1].integer).toBe(1);
			expect(docs[2].integer).toBe(0);
			done();
		});
	});

	it("find({}, {sort:{integer: -1}, limit: 1}})", function(done){
		collection.find({}, {sort:{integer: -1}, limit: 1},  function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(1);
			expect(docs[0].msg).toBe('great');
			done();
		});
	});

	it("find({}, {sort:{integer: -1}, limit: 2, skip:1}})", function(done){
		collection.find({}, {sort:{integer: -1}, limit: 2, skip:1},  function(err, docs){
			if(err)
				console.log(err);
			expect(docs.length).toBe(2);
			expect(docs[0].msg).toBe('tule');
			expect(docs[1].integer).toBe(1);
			done();
		});
	});

	it("findOne({msg:'great'})", function(done){
		collection.findOne({msg:'great'}, function(err, doc){
			if(err)
				console.log(err);
			expect(doc.integer).toBe(3);
			done();
		});
	});

	it("findOne({msg:'hello'}, {sort: {integer: -1}})", function(done){
		collection.findOne({msg:'hello'}, {sort: {integer: -1}}, function(err, doc){
			if(err)
				console.log(err);
			expect(doc.integer).toBe(1);
			done();
		});
	});


	it("findOne({msg:'bye'})", function(done){
		collection.findOne({msg:'bye'}, function(err, doc){
			if(err)
				console.log(err);
			expect(doc).toBeNull();
			done();
		});
	});


	it("save({msg: 'extra', integer: 4})", function(done){
		collection.save({msg: 'extra', integer: 4}, function(err, doc){
			if(err)
				console.log(err);

			savedDoc = doc;
			expect(doc.msg).toBe('extra');
			done();
		});
	});

	it("Updating a document using save", function(done){
		savedDoc.msg = 'saved';
		collection.save(savedDoc, function(err, saved){
			if(err)
				console.log(err);

			expect(saved).toBe(1);
			collection.findOne(savedDoc, function(err, doc){
				if(err)
					console.log(err);

				expect(doc.msg).toBe('saved');
				done();
			});
		});
	});

	it("update({_id: savedDoc._id}, {$set: {msg: 'updated'}})", function(done){
		collection.update({_id: savedDoc._id}, {$set: {msg: 'updated'}}, function(err, updated){
			if(err)
				console.log(err);

			expect(updated).toBe(1);
			collection.findOne({_id: savedDoc._id}, function(err, doc){
				if(err)
					console.log(err);

				expect(doc.msg).toBe('updated');
				expect(doc.integer).toBe(4);
				done();
			});
		});
	});

	it("update({_id: savedDoc._id}, {msg: 'replaced'})", function(done){
		collection.update({_id: savedDoc._id}, {msg: 'replaced'}, function(err, updated){
			if(err)
				console.log(err);

			expect(updated).toBe(1);
			collection.findOne({_id: savedDoc._id}, function(err, doc){
				if(err)
					console.log(err);

				expect(doc.msg).toBe('replaced');
				expect(doc.integer).toBeUndefined();
				done();
			});
		});
	});

	it("update({msg: 'hello'}, {msg: 'tule'})", function(done){
		collection.update({msg: 'hello'}, {msg: 'tule'}, function(err, updated){
			if(err)
				console.log(err);

			expect(updated).toBe(1);
			collection.find({msg: 'tule'}, function(err, docs){
				if(err)
					console.log(err);

				expect(docs.length).toBe(2);
				done();
			});
		});
	});

	it("update({msg: 'tule'}, {$set: {msg: 'tulecmjs'}}, {multi: true})", function(done){
		collection.update({msg: 'tule'}, {$set: {msg: 'tulecmjs'}}, {multi: true}, function(err, updated){
			if(err)
				console.log(err);

			expect(updated).toBe(2);
			collection.find({msg: 'tulecmjs'}, function(err, docs){
				if(err)
					console.log(err);

				expect(docs.length).toBe(2);
				done();
			});
		});
	});

	it("update({_id: 123}, {msg: 'notinserted'})", function(done){
		collection.update({_id: 123}, {msg: 'notinserted'}, function(err, updated){
			if(err)
				console.log(err);

			expect(updated).toBe(0);
			collection.findOne({_id: 123}, function(err, doc){
				if(err)
					console.log(err);

				expect(doc).toBeNull();
				done();
			});
		});
	});

	it("update({msg: 'nonexistent'}, {msg: 'existent', integer: 100}, {upsert:true})", function(done){
		collection.update({msg: 'nonexistent'}, {msg: 'existent', integer: 100}, {upsert:true}, function(err, updated){
			if(err)
				console.log(err);

			expect(updated).toBe(1);
			collection.findOne({msg: 'existent'}, function(err, doc){
				if(err)
					console.log(err);

				expect(doc.integer).toBe(100);
				done();
			});
		});
	});

	it("renameCollection()", function(done){
		driver.renameCollection(cname, 'new' + cname, function(err){
			expect(err).toBeNull();
			driver.getCollectionNames(function(err, names){
				var index = names.indexOf('new' + cname);
				expect(names.length).toBe(collectionCount + 1);
				expect(index).not.toBe(-1);
				done();
			});
		});
	});

	it("dropCollection()", function(done){
		driver.dropCollection('new' + cname, function(err){
			expect(err).toBeNull();
			driver.getCollectionNames(function(err, names){
				var index = names.indexOf('new' + cname);
				expect(names.length).toBe(collectionCount);
				expect(index).toBe(-1);
				done();
			});
		});
	});

});