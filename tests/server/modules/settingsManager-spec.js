var path = require('path'),
	when = require('when'),
	config = require('config'),
	db = require(path.join(__dirname, '../../..', 'server/modules/db/mongoDriver')),
	//db = require(path.join(__dirname, '../../..', 'server/plugins/nedb/nedbDriver')),
	hooks = {filter: function(hook, val){return {then: function(clbk){clbk(val);}};}},
	promise
;

// Add modules path to the config
config.path = {modules: path.join(__dirname, '../../..', 'server/modules')};

// Add the settings collection
config.tule = {settingsCollection: 'tuleSettings'};

// Mongo settings
config.mongo = 'mongodb://localhost:27017/tule';


var dbManager = require(config.path.modules + '/db/dbManager');


//config.nedb = {dataPath: path.join(__dirname, 'nedb')};
promise = db.init()
	.then(function(instance){
		// Mock getInstance
		dbManager.getInstance = function(){
			return instance;
		};
	})
	.catch(function(){
		console.log('WOOOA!');
	})
;


/** SETUP FINISHED */


var settingName = Math.floor(Math.random() * 100000),
	settingValue = settingName + 1
;

describe('Settings Manager tests', function() {
	var manager;

	it('Create public setting', function(done){

		// Wait for the db to be ready
		promise.then(function(d){

			manager = require(path.join(__dirname, '../../..', 'server/modules/settings/settingsManager'));
			manager.init({hooks: hooks});

			manager.save(settingName, settingValue, true)
				.then(function(val) {
					expect(val).toBe(settingValue);
					done();
				})
				.catch(function(err) {
					console.log('Error: ' + err);
					done();
				})
			;
		});
	});

	it('Get with a public setting', function(done) {
		manager.get(settingName)
			.done(
				function(val) {
					expect(val).toBe(settingValue);
					done();

				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});


	it('GetPublic with a public setting', function(done) {
		manager.getPublic(settingName)
			.done(
				function(val) {
					expect(val).toBe(settingValue);
					done();

				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});

	it('Update with a public', function(done) {
		manager.save(settingName, settingValue + 1)
			.done(
				function(val) {
					expect(val).toBe(settingValue + 1);
					done();

				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});

	it('Get updated setting', function(done) {
		manager.get(settingName)
			.done(
				function(val) {
					expect(val).toBe(settingValue + 1);
					done();

				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});

	it('Delete', function(done) {
		manager.remove(settingName)
			.done(
				function(val) {
					expect(val).toBe(undefined);
					done();

				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});

	it('Get a deleted setting should fail', function(done) {
		manager.get(settingName)
			.done(
				function(val) {
					expect(val).toBe(undefined);
					done();
				},
				function(err) {
					done();
				}
			)
		;
	});

	it('Create private setting', function(done){
		manager.save(settingName, settingValue)
			.then(function(val) {
				expect(val).toBe(settingValue);
				done();
			})
			.catch(function(err) {
				console.log('Error: ' + err);
				done();
			})
		;
	});

	it('Get with a private setting', function(done) {
		manager.get(settingName)
			.done(
				function(val) {
					expect(val).toBe(settingValue);
					done();

				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});


	it('GetPublic with a private setting should fail', function(done) {
		manager.getPublic(settingName)
			.done(
				function(val) {
					console.log('Error: Private setting returns a value for getPublic: ' + val);
					done();

				},
				function(err) {
					expect(err).toBe('Private setting.');
					done();
				}
			)
		;
	});

	it('Update a setting to be public', function(done) {
		manager.save(settingName, settingValue, true)
			.done(
				function(val) {
					expect(val).toBe(settingValue);
					done();
				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});

	it('GetPublic with the updated public setting', function(done) {
		manager.getPublic(settingName)
			.done(
				function(val) {
					expect(val).toBe(settingValue);
					done();

				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});

	it('Update a setting to be private', function(done) {
		manager.save(settingName, settingValue, false)
			.done(
				function(val) {
					expect(val).toBe(settingValue);
					done();
				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});

	it('GetPublic with the updated private setting should fail', function(done) {
		manager.getPublic(settingName)
			.done(
				function(val) {
					console.log('Error: Private setting returns a value for getPublic: ' + val);
					done();

				},
				function(err) {
					expect(err).toBe('Private setting.');
					done();
				}
			)
		;
	});

	it('Delete 2', function(done) {
		manager.remove(settingName)
			.done(
				function(val) {
					expect(val).toBe(undefined);
					done();

				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});

	it('Get a deleted setting should fail 2', function(done) {
		manager.get(settingName)
			.done(
				function(val) {
					expect(val).toBe(undefined);
					done();
				},
				function(err) {
					done();
				}
			)
		;
	});

	it('Create a static public setting', function(){
		var setting = manager.setStatic(settingName, settingValue, true);

		expect(setting).toEqual({value: settingValue, isPublic: true});
	});

	it('Re-defining a static setting should return false', function(){
		var setting = manager.setStatic(settingName, settingValue, true);

		expect(setting).toBe(false);
	});

	it('Get with a static public setting', function(done) {
		manager.get(settingName)
			.done(
				function(val) {
					expect(val).toBe(settingValue);
					done();

				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});

	it('GetPublic with a static public setting', function(done) {
		manager.getPublic(settingName)
			.done(
				function(val) {
					expect(val).toBe(settingValue);
					done();

				},
				function(err) {
					console.log('Error: ' + err);
					done();
				}
			)
		;
	});

	it('Update a static setting should fail', function(done) {
		manager.save(settingName, settingValue)
			.done(
				function(val) {
					expect(val).toBe(undefined);
					done();
				},
				function(err) {
					expect(err).toBeTruthy();
					done();
				}
			)
		;
	});

	it('Delete a static setting should fail', function(done) {
		manager.remove(settingName)
			.done(
				function(val) {
					expect(val).toBe(undefined);
					done();
				},
				function(err) {
					expect(err).toBeTruthy();
					done();
				}
			)
		;
	});

	it('Create a static private setting', function(){
		var setting = manager.setStatic(settingName + 1, settingValue);

		expect(setting).toEqual({value: settingValue, isPublic: false});
	});

	it('GetPublic with a static private setting', function(done) {
		manager.getPublic(settingName + 1)
			.done(
				function(val) {
					expect(val).toBe(undefined);
					done();

				},
				function(err) {
					expect(err).toBeTruthy();
					done();
				}
			)
		;
	});
});