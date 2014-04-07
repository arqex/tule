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
		collectionCount, driver, collection
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
		collection.insert({msg: 'hello', integer: 0}, function(err, doc){
			collection.count(function(err, count){
				expect(count).toBe(1);
				done();
			});
		});
	});


	it("multiple collection.insert()", function(done){
		collection.insert([{msg: 'hello', integer: 1}, {msg: 'tule', integer: 2},{msg: 'great', integer: 3}], function(err, doc){
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