var path = require('path'),
	when = require('when'),
	hookManager = require(path.join(__dirname, '../../..', 'server/modules/hooks/hooksManager'))
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

describe('Filter Manager', function(){
	it("Trigger a filter without hooked functions", function(done){
		hookManager.filter('hook', '').then(function(count){
			expect(count).toBe('');
			done();
		});
	});

	it("Add a filter, default priority", function(done){
		hookManager.addFilter('hook', one);
		hookManager.filter('hook', '').then(function(count){
			expect(count).toBe(' 1');
			done();
		});
	});

	it("Add a second filter with higher priority", function(done){
		hookManager.addFilter('hook', 5, two);
		hookManager.filter('hook', '').then(function(count){
			expect(count).toBe(' 2 1');
			done();
		});

	});

	it("Add a second filter with lower priority", function(done){
		hookManager.addFilter('hook', -5, three);
		hookManager.filter('hook', '').then(function(count){
			expect(count).toBe(' 2 1 3');
			done();
		});

	});

	it("Remove first filter", function(done){
		hookManager.removeFilter('hook', one);
		hookManager.filter('hook', '').then(function(count){
			expect(count).toBe(' 2 3');
			done();
		});
	});

	it("Remove filter with lower priority", function(done){
		hookManager.removeFilter('hook', three);
		hookManager.filter('hook', '').then(function(count){
			expect(count).toBe(' 2');
			done();
		});

	});

	it("Remove remaining filter", function(done){
		hookManager.removeFilter('hook', two);
		hookManager.filter('hook', '').then(function(count){
			expect(count).toBe('');
			done();
		});

	});

	it("Add a two filters with the same priority", function(done){
		hookManager.addFilter('double', one);
		hookManager.addFilter('double', two);
		hookManager.filter('double', '').then(function(count){
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
		hookManager.trigger('hook').then(function(){
			expect(text).toBe('hello');
			done();
		});
	});

	it("Add an action", function(){
		hookManager.on('hook', myfriend);
		hookManager.trigger('hook').then(function(done){
			expect(text).toBe('hello myfriend');
			done();
		});
	});

	it("Remove an action", function(){
		hookManager.off('hook', myfriend);
		hookManager.trigger('hook').then(function(done){
			expect(text).toBe('hello myfriend');
			done();
		});
	});

	it("Add an action with arguments", function(done){
		hookManager.on('hook', myfriendName);
		hookManager.trigger('hook', 'Paul', 'Smith').then(function(){
			expect(greeting).toBe(' myfriend Paul Smith');
			done();
		});
	});

	it("Add a second action with higher priority", function(done){
		hookManager.on('hook', 1, resetGretting);
		hookManager.trigger('hook', 'Paul', 'Smith').then(function(){
			expect(greeting).toBe('hello myfriend Paul Smith');
			done();
		});
	});

	it("Add a second action with lower priority", function(done){
		hookManager.on('hook', -1, bye);
		hookManager.trigger('hook', 'Paul', 'Smith').then(function(){
			expect(greeting).toBe('bye bye');
			done();
		});
	});

	it("Actions with same priority should be called at the same time", function(){
		abc = "";
		hookManager.on('abc', a);
		hookManager.on('abc', b);
		hookManager.on('abc', c);
		hookManager.trigger('abc').then(function(){
			expect(abc).toBe('bca');
			done();
		});
	});

	it("Actions with same priority should be called at the same time 2", function(){
		abc = "";
		hookManager.on('bca', c);
		hookManager.on('bca', a);
		hookManager.on('bca', b);
		hookManager.trigger('bca').then(function(){
			expect(abc).toBe('bca');
			done();
		});
	});
});