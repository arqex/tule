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