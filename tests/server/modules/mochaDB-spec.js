"use strict";

var path = require("path"),
	db = require(path.join(__dirname, "../../..", "server/modules/db/mongoDriver")),
	options = {url: "mongodb://localhost:27017/tuleTest"},
	assert = require('assert'),

	// nedb options
	// db = require(path.join(__dirname, "../../..", "server/plugins/nedb/nedbDriver")),
	// options = {dataPath: path.join(__dirname, "nedb")},
	promise, hooks
;

hooks = {
	filter: function( name, arg ){
		return {
			then: function( clbk ){
				clbk( arg );
			}
		};
	}
};

promise = db.init(options, hooks);

describe("Driver API", function() {
	var cname = "testCollectionName",
		collectionCount, driver, collection, savedDoc, docCount
	;

	it("getCollectionNames()", function(done){
		promise.then(function(d){
			console.log( 'DB inited');
			driver = d;
			driver.getCollectionNames(function(err, names){
				assert.equal( err, null);
				collectionCount = names.length;
				done();
			});
		}).catch(function(err){
			console.log("ERRROR GORDO: " + err);
			done();
		});
	});

	it("createCollection()", function(done){
		driver.createCollection(cname, function(err){
			assert.equal( err, null );
			driver.getCollectionNames(function(err, names){
				var index = names.indexOf(cname);
				console.log(names);
				assert.equal( names.length, collectionCount + 1);
				assert.notEqual( index, -1);
				done();
			});
		});
	});

	it("collection()", function(done){
		collection = driver.collection(cname);
		assert.equal(typeof collection.find, "function");
		assert.equal(typeof collection.findOne, "function");
		assert.equal(typeof collection.insert, "function");
		assert.equal(typeof collection.update, "function");
		assert.equal(typeof collection.save, "function");
		assert.equal(typeof collection.remove, "function");
		assert.equal(typeof collection.count, "function");
		done();
	});


	it("collection.count() works without parameters", function(done){
		collection.count(function(err, count){
			console.log("COOOOUNT");
			assert.equal(count, 0);
			done();
		});
	});

	it("single collection.insert()", function(done){
		collection.insert({msg: "hello", integer: 0}, function(err, docs){
			collection.count(function(err, count){
				assert.equal(count, 1);
				done();
			});
		});
	});


	it("multiple collection.insert()", function(done){
		collection.insert([{msg: "hello", integer: 1}, {msg: "tule", integer: 2},{msg: "great", integer: 3}], function(err, docs){
			collection.count(function(err, count){
				assert.equal(count, 4);
				done();
			});
		});
	});

	it("find({})", function(done){
		collection.find({}, function(err, docs){
			if(err)
				console.log(err);

			assert.equal( 4, docs.length );
			assert.equal(docs.length, 4);
			done();
		});
	});

	it("find({msg: 'hello'}) expect 2 documents", function(done){
		collection.find({msg: "hello"}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 2);
			done();
		});
	});

	it("collection.count({msg: 'hello'})", function(done){
		collection.count({msg: "hello"}, function(err, count){
			assert.equal(count, 2);
			done();
		});
	});

	it("find({msg: 'bye'}) expect 0 documents", function(done){
		collection.find({msg: "bye"}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 0);
			done();
		});
	});

	it("find({msg: 'hello', integer: 1}) expect 1 document", function(done){
		collection.find({msg: 'hello', integer: 1}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 1)
			done();
		});
	});

	it("find({msg: 'tule'}) expect integer = 2", function(done){
		collection.find({msg: 'tule'}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs[0].integer, 2)
			done();
		});
	});

	it("find({integer: {$gt: 1}}) expect 2 documents", function(done){
		collection.find({integer: {$gt: 1}}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 2)
			done();
		});
	});

	it("find({integer: {$gte: 1}}) expect 3 documents", function(done){
		collection.find({integer: {$gte: 1}}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 3)
			done();
		});
	});

	it("find({integer: {$gte: 1.5}}) expect 2 documents", function(done){
		collection.find({integer: {$gte: 1.5}}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 2)
			done();
		});
	});

	it("find({integer: {$lt: 1}}) expect 1 document1", function(done){
		collection.find({integer: {$lt: 1}}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 1)
			done();
		});
	});

	it("find({integer: {$gte: 1}}) expect 2 documents", function(done){
		collection.find({integer: {$lte: 1}}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 2)
			done();
		});
	});

	it("find({msg: {$ne: 'hello'}}) expect 2 documents", function(done){
		collection.find({msg: {$ne: 'hello'}}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 2)
			done();
		});
	});

	it("find({msg: {$in: ['hello', 'great']}}) expect 3 documents", function(done){
		collection.find({msg: {$in: ['hello', 'great']}}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 3)
			done();
		});
	});

	it("find({msg: {$nin: ['tule', 'great']}}) expect 2 documents", function(done){
		collection.find({msg: {$nin: ['tule', 'great']}}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 2)
			done();
		});
	});

	it("find({$or:[{msg: 'hello'}, {integer: 3}]}) expect 3 documents", function(done){
		collection.find({$or:[{msg: 'hello'}, {integer: 3}]}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 3)
			done();
		});
	});

	it("find({$and:[{msg: 'hello'}, {integer: 1}]}) expect 1 documents", function(done){
		collection.find({$and:[{msg: 'hello'}, {integer: 1}]}, function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 1)
			done();
		});
	});
	/*
	it("find({msg: {$not: 'hello'}}) expect 2 documents", function(done){
		collection.find( {msg: {$not: 'hello'}}, function(err, docs){
			if(err)
				console.log(err);

			assert.equal(docs.length, 2);
			done();
		});
	});
	*/
	it("find({msg:'hello'}, {sort:{integer: -1}})", function(done){
		collection.find({msg:'hello'}, {sort:{integer: -1}},  function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs[0].integer, 1)
			assert.equal(docs[1].integer, 0)
			done();
		});
	});

	it("find({msg:'hello'}, {sort:{integer: 1}})", function(done){
		collection.find({msg:'hello'}, {sort:{integer: 1}},  function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs[0].integer, 0)
			assert.equal(docs[1].integer, 1)
			done();
		});
	});

	it("find({}, {sort:{integer: -1}})", function(done){
		collection.find({}, {sort:{integer: -1}},  function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs[0].msg, 'great')
			assert.equal(docs[1].msg, 'tule')
			assert.equal(docs[2].integer, 1)
			assert.equal(docs[3].integer, 0)
			done();
		});
	});

	it("find({}, {sort:{integer: -1}, skip: 1}})", function(done){
		collection.find({}, {sort:{integer: -1}, skip: 1},  function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs[0].msg, 'tule')
			assert.equal(docs[1].integer, 1)
			assert.equal(docs[2].integer, 0)
			done();
		});
	});

	it("find({}, {sort:{integer: -1}, limit: 1}})", function(done){
		collection.find({}, {sort:{integer: -1}, limit: 1},  function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 1)
			assert.equal(docs[0].msg, 'great')
			done();
		});
	});

	it("find({}, {sort:{integer: -1}, limit: 2, skip:1}})", function(done){
		collection.find({}, {sort:{integer: -1}, limit: 2, skip:1},  function(err, docs){
			if(err)
				console.log(err);
			assert.equal(docs.length, 2)
			assert.equal(docs[0].msg, 'tule')
			assert.equal(docs[1].integer, 1)
			done();
		});
	});

	it("findOne({msg:'great'})", function(done){
		collection.findOne({msg:'great'}, function(err, doc){
			if(err)
				console.log(err);
			assert.equal(doc.integer, 3)
			done();
		});
	});

	it("findOne({msg:'hello'}, {sort: {integer: -1}})", function(done){
		collection.findOne({msg:'hello'}, {sort: {integer: -1}}, function(err, doc){
			if(err)
				console.log(err);
			assert.equal(doc.integer, 1)
			done();
		});
	});


	it("findOne({msg:'bye'})", function(done){
		collection.findOne({msg:'bye'}, function(err, doc){
			if(err)
				console.log(err);
			assert.equal(doc, null);
			done();
		});
	});

	it("save({msg: 'extra', integer: 4})", function(done){
		collection.save({msg: 'extra', integer: 4}, function(err, doc){
			if(err)
				console.log(err);
			//Save it after json, to not depend on objectId
			savedDoc = JSON.parse(JSON.stringify(doc));
			assert.equal(doc.msg, 'extra')
			done();
		});
	});

	it("Updating a document using save", function(done){
		savedDoc.msg = 'saved';

		collection.save(savedDoc, function(err, saved){
			if(err)
				console.log(err);

			assert.equal(saved, 1)
			collection.findOne(savedDoc, function(err, doc){
				if(err)
					console.log(err);

				assert.equal(doc.msg, 'saved')
				done();
			});
		});
	});

	it("update({_id: savedDoc._id}, {$set: {msg: 'updated'}})", function(done){
		collection.update({_id: savedDoc._id}, {$set: {msg: 'updated'}}, function(err, updated){
			if(err)
				console.log(err);

			assert.equal(updated, 1)
			collection.findOne({_id: savedDoc._id}, function(err, doc){
				if(err)
					console.log(err);

				assert.equal(doc.msg, 'updated')
				assert.equal(doc.integer, 4)
				done();
			});
		});
	});

	it("update({_id: savedDoc._id}, {msg: 'replaced'})", function(done){
		collection.update({_id: savedDoc._id}, {msg: 'replaced'}, function(err, updated){
			if(err)
				console.log(err);

			assert.equal(updated, 1)
			collection.findOne({_id: savedDoc._id}, function(err, doc){
				if(err)
					console.log(err);

				assert.equal(doc.msg, 'replaced');
				assert.equal(doc.integer, undefined);
				done();
			});
		});
	});

	it("update({msg: 'hello'}, {msg: 'tule'})", function(done){
		collection.update({msg: 'hello'}, {msg: 'tule'}, function(err, updated){
			if(err)
				console.log(err);

			assert.equal(updated, 1)
			collection.find({msg: 'tule'}, function(err, docs){
				if(err)
					console.log(err);

				assert.equal(docs.length, 2)
				done();
			});
		});
	});

	it("update({msg: 'tule'}, {$set: {msg: 'tulecmjs'}}, {multi: true})", function(done){
		collection.update({msg: 'tule'}, {$set: {msg: 'tulecmjs'}}, {multi: true}, function(err, updated){
			if(err)
				console.log(err);

			assert.equal(updated, 2)
			collection.find({msg: 'tulecmjs'}, function(err, docs){
				if(err)
					console.log(err);

				assert.equal(docs.length, 2)
				done();
			});
		});
	});

	it("update({_id: 123}, {msg: 'notinserted'})", function(done){
		collection.update({_id: 123}, {msg: 'notinserted'}, function(err, updated){
			if(err)
				console.log(err);

			assert.equal(updated, 0)
			collection.findOne({_id: 123}, function(err, doc){
				if(err)
					console.log(err);

				assert.equal(doc, null);
				done();
			});
		});
	});

	it("update({msg: 'nonexistent'}, {msg: 'existent', integer: 100}, {upsert:true})", function(done){
		collection.update({msg: 'nonexistent'}, {msg: 'existent', integer: 100}, {upsert:true}, function(err, updated){
			if(err)
				console.log(err);

			assert.equal(updated, 1)
			collection.findOne({msg: 'existent'}, function(err, doc){
				if(err)
					console.log(err);

				assert.equal(doc.integer, 100)
				done();
			});
		});
	});


	it("update({msg: 'nonexistent'}, {msg: 'existent', integer: 100}, {upsert:true})", function(done){
		collection.update({msg: 'nonexistent'}, {msg: 'existent', integer: 100}, {upsert:true}, function(err, updated){
			if(err)
				console.log(err);

			assert.equal(updated, 1)
			collection.findOne({msg: 'existent'}, function(err, doc){
				if(err)
					console.log(err);

				assert.equal(doc.integer, 100)
				done();
			});
		});
	});

	it("remove({msg:'great'}) removes 1 document", function(done){
		collection.count(function(err, count){
			docCount = count;

			collection.remove({msg:'great'}, function(err, removed){
				assert.equal(removed, 1)

				collection.count(function(err, recount){
					assert.equal(recount, docCount - 1)
					docCount = recount;
					done();
				});
			});
		});
	});

	it("remove({_id: savedDoc._id}) removes 1 document", function(done){
		collection.count(function(err, count){
			docCount = count;

			collection.remove({_id: savedDoc._id}, function(err, removed){
				assert.equal(removed, 1)

				collection.count(function(err, recount){
					assert.equal(recount, docCount - 1)
					docCount = recount;
					done();
				});
			});
		});
	});

	it("remove({}) removes all elements", function(done){
		collection.remove({}, function(err, removed){
			if(err)
				console.log(err);

			collection.count(function(err, count){
				assert.equal(count, 0)
				done();
			});
		});
	});

	it("aggregate()", function(done){
		collection.insert([
			{ cust_id: "abc1", ord_date: new Date("2012-11-02T17:04:11.102Z"), status: "A", amount: 50 },
			{ cust_id: "xyz1", ord_date: new Date("2013-10-01T17:04:11.102Z"), status: "A", amount: 100 },
			{ cust_id: "xyz1", ord_date: new Date("2013-10-12T17:04:11.102Z"), status: "D", amount: 25 },
			{ cust_id: "xyz1", ord_date: new Date("2013-10-11T17:04:11.102Z"), status: "D", amount: 125 },
			{ cust_id: "abc1", ord_date: new Date("2013-11-12T17:04:11.102Z"), status: "A", amount: 25 }
		], function( err, inserted ){
			assert.equal( inserted.length, 5);
			collection.aggregate([
				{ $match: { status: "A" } },
				{ $group: { _id: "$cust_id", total: { $sum: "$amount" } } },
				{ $sort: { total: -1 } }
			], function( err, docs ){
				if( err )
					console.log( err );

				assert.equal( docs.length, 2 );
				assert.equal( docs[0]._id, "xyz1" );
				assert.equal( docs[0].total, 100 );
				assert.equal( docs[1]._id, "abc1" );
				assert.equal( docs[1].total, 75 );
				done();
			});
		});
	});

	it("renameCollection()", function(done){
		driver.renameCollection(cname, 'new' + cname, function(err){
			assert.equal(err, null);

			driver.getCollectionNames(function(err, names){
				var index = names.indexOf('new' + cname);
				assert.notEqual(index, -1);
				console.log(names);
				assert.equal(names.length, collectionCount + 1)
				done();
			});
		});
	});

	it("dropCollection()", function(done){
		driver.dropCollection('new' + cname, function(err){
			assert.equal(err, null);
			driver.getCollectionNames(function(err, names){
				var index = names.indexOf('new' + cname);
				console.log(names);

				assert.equal(names.length, collectionCount)
				assert.equal(index, -1)
				done();
			});
		});
	});
});