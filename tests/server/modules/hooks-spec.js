'use strict';

var path = require('path'),
	when = require('when'),
	hooksManager = require(path.join(__dirname, '../../..', 'server/modules/plugins/hooksManager'))
;


// Helper functions
var count = '';
var one = function(count){
		return count + ' 1' ;
	},
	two = function(count){
		var deferred = when.defer();
		setTimeout(function(){
			deferred.resolve(count + ' 2');
		},1000);
		return deferred.promise;
	},
	three = function(count){
		return count + ' 3';
	}
;

// Let's create a hook object like the one in the plugin manager
var pluginHash = 'p' + Math.floor(Math.random() * 10000000),
	actions = {},
	filters = {},
	hooks = {
		on: hooksManager.on.bind(this, actions, pluginHash),
		off: hooksManager.off.bind(this, actions),
		trigger: hooksManager.trigger.bind(this, actions, false),
		addFilter: hooksManager.on.bind(this, filters, pluginHash),
		removeFilter: hooksManager.off.bind(this, filters),
		filter: hooksManager.trigger.bind(this, filters, true)
	}
;

describe('Filter Manager', function(){
	it("Trigger a filter without hooked functions", function(done){
		hooks.filter('hook', '').then(function(count){
			expect(count).toBe('');
			done();
		});
	});

	it("Add a filter, default priority", function(done){
		hooks.addFilter('hook', one);
		hooks.filter('hook', '').then(function(count){
			expect(count).toBe(' 1');
			done();
		});
	});

	it("Add a second filter with higher priority", function(done){
		hooks.addFilter('hook', 5, two);
		hooks.filter('hook', '').then(function(count){
			expect(count).toBe(' 2 1');
			done();
		});

	});

	it("Add a second filter with lower priority", function(done){
		hooks.addFilter('hook', -5, three);
		hooks.filter('hook', '').then(function(count){
			expect(count).toBe(' 2 1 3');
			done();
		});

	});

	it("Remove first filter", function(done){
		hooks.removeFilter('hook', one);
		hooks.filter('hook', '').then(function(count){
			expect(count).toBe(' 2 3');
			done();
		});
	});

	it("Remove filter with lower priority", function(done){
		hooks.removeFilter('hook', three);
		hooks.filter('hook', '').then(function(count){
			expect(count).toBe(' 2');
			done();
		});

	});

	it("Remove remaining filter", function(done){
		hooks.removeFilter('hook', two);
		hooks.filter('hook', '').then(function(count){
			expect(count).toBe('');
			done();
		});

	});

	it("Add a two filters with the same priority", function(done){
		hooks.addFilter('double', one);
		hooks.addFilter('double', two);
		hooks.filter('double', '').then(function(count){
			expect(count).toBe(' 1 2');
			done();
		});
	});
});


var text = 'hello',
	myfriend = function(){
		text += ' myfriend';
	},
	greeting = '',
	resetGretting = function(){
		greeting = 'hello';
	},
	myfriendName = function(name, surname){
		greeting += ' myfriend ' + name + ' ' + surname;
	},
	bye = function(){
		greeting = 'bye bye';
	}
;

var abc = '',
	a = function(){
		var deferred = when.defer();
		setTimeout(function(){
			abc += 'a';
			deferred.resolve();
		}, 1000);
		return deferred.promise;
	},
	b = function(){
		abc += 'b';
	},
	c = function(){
		var deferred = when.defer();
		setTimeout(function(){
			abc += 'c';
			deferred.resolve();
		}, 500);
		return deferred.promise;
	}
;

describe('Action Manager', function(){
	it("Trigger an action without functions hooked", function(done){
		hooks.trigger('hook').then(function(){
			expect(text).toBe('hello');
			done();
		});
	});

	it("Add an action", function(){
		hooks.on('hook', myfriend);
		hooks.trigger('hook').then(function(done){
			expect(text).toBe('hello myfriend');
			done();
		});
	});

	it("Remove an action", function(){
		hooks.off('hook', myfriend);
		hooks.trigger('hook').then(function(done){
			expect(text).toBe('hello myfriend');
			done();
		});
	});

	it("Add an action with arguments", function(done){
		hooks.on('hook', myfriendName);
		hooks.trigger('hook', 'Paul', 'Smith').then(function(){
			expect(greeting).toBe(' myfriend Paul Smith');
			done();
		});
	});

	it("Add a second action with higher priority", function(done){
		hooks.on('hook', 1, resetGretting);
		hooks.trigger('hook', 'Paul', 'Smith').then(function(){
			expect(greeting).toBe('hello myfriend Paul Smith');
			done();
		});
	});

	it("Add a second action with lower priority", function(done){
		hooks.on('hook', -1, bye);
		hooks.trigger('hook', 'Paul', 'Smith').then(function(){
			expect(greeting).toBe('bye bye');
			done();
		});
	});

	it("Actions with same priority should be called at the same time", function(){
		abc = "";
		hooks.on('abc', a);
		hooks.on('abc', b);
		hooks.on('abc', c);
		hooks.trigger('abc').then(function(){
			expect(abc).toBe('bca');
			done();
		});
	});

	it("Actions with same priority should be called at the same time 2", function(){
		abc = "";
		hooks.on('bca', c);
		hooks.on('bca', a);
		hooks.on('bca', b);
		hooks.trigger('bca').then(function(){
			expect(abc).toBe('bca');
			done();
		});
	});
});