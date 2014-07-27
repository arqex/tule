var require = require('amdrequire'),
	path = require('path'),
	translator = require(path.join(__dirname, '../../..', 'public/app/modules/collections/queryTranslator'))
;

describe('String to query', function(){
	it('Empty query string', function(){
		expect(function(){translator.toQuery('');})
			.toThrow();
	});

	it('Empty parenthesis query string', function(){
		expect(function(){translator.toQuery('()');})
			.toThrow();
	});

	it('Simple eq query string', function(){
		expect(translator.toQuery('one|eq|two')).toEqual({one: 'two'});
	});

	it('Simple gt query string', function(){
		expect(translator.toQuery('one|gt|two')).toEqual({one: {$gt: 'two'}});
	});

	it('Simple gte query string', function(){
		expect(translator.toQuery('one|gte|two')).toEqual({one: {$gte: 'two'}});
	});

	it('Simple lt query string', function(){
		expect(translator.toQuery('one|lt|two')).toEqual({one: {$lt: 'two'}});
	});


	it('Simple lte query string', function(){
		expect(translator.toQuery('one|lte|two')).toEqual({one: {$lte: 'two'}});
	});

	it('Simple in query string', function(){
		expect(translator.toQuery('one|in|two')).toEqual({one: {$in: 'two'}});
	});

	it('Simple nin query string', function(){
		expect(translator.toQuery('one|nin|two')).toEqual({one: {$nin: 'two'}});
	});

	it('Simple notdefinedoperator query string', function(){
		expect(function(){translator.toQuery('one|notdefinedoperator|two');})
			.toThrow();
	});

	it('Uncomplete simple query string', function(){
		expect(function(){translator.toQuery('one|eq|');})
			.toThrow();
	});

	it('Uncomplete simple query string 2', function(){
		expect(function(){translator.toQuery('one|eq');})
			.toThrow();
	});


	it('Logical and query string', function(){
		expect(translator.toQuery('and(one|eq|two,one|eq|two)'))
			.toEqual({$and: [{one: 'two'}, {one: 'two'}]});
	});

	it('Logical or query string', function(){
		expect(translator.toQuery('or(one|eq|two,one|eq|two)'))
			.toEqual({$or: [{one: 'two'}, {one: 'two'}]});
	});

	it('Logical not query string', function(){
		expect(translator.toQuery('not(one|eq|two,one|eq|two)'))
			.toEqual({$not: [{one: 'two'}, {one: 'two'}]});
	});

	it('Logical nor query string', function(){
		expect(translator.toQuery('nor(one|eq|two,one|eq|two)'))
			.toEqual({$nor: [{one: 'two'}, {one: 'two'}]});
	});

	it('Logical notdefinedoperator query string', function(){
		expect(function(){translator.toQuery('notdefinedoperator(one|eq|two,one|eq|two)');})
			.toThrow();
	});

	it('Uncomplete logical query string', function(){
		expect(function(){translator.toQuery('notdefinedoperator(one|eq|two,one|eq|two,)');})
			.toThrow();
	});

	it('Empty logical query string', function(){
		expect(function(){translator.toQuery('notdefinedoperator()');})
			.toThrow();
	});

	it('Nested logical query string', function(){
		expect(translator.toQuery('nor(one|eq|two,and(one|eq|two,one|eq|two),one|eq|two)'))
			.toEqual({$nor: [{one: 'two'}, {$and: [{one: 'two'}, {one: 'two'}]}, {one: 'two'}]});
	});

	it('Double nested logical query string', function(){
		expect(translator.toQuery('nor(one|eq|two,and(one|eq|two,or(one|eq|two,one|eq|two)),one|eq|two)'))
			.toEqual({$nor: [{one: 'two'}, {$and: [{one: 'two'}, {$or: [{one: 'two'}, {one: 'two'}]}]}, {one: 'two'}]});
	});

});

describe('Query to string', function(){
	it('Simple query', function(){
		expect(translator.toString({one: 'two'}))
			.toBe('and(one|eq|two)');
	});

	it('Simple lt query', function(){
		expect(translator.toString({one: {$lt: 'two'}}))
			.toBe('and(one|lt|two)');
	});

	it('Simple lte query', function(){
		expect(translator.toString({one: {$lte: 'two'}}))
			.toBe('and(one|lte|two)');
	});

	it('Simple gt query', function(){
		expect(translator.toString({one: {$gt: 'two'}}))
			.toBe('and(one|gt|two)');
	});

	it('Simple gte query', function(){
		expect(translator.toString({one: {$gte: 'two'}}))
			.toBe('and(one|gte|two)');
	});

	it('Simple in query', function(){
		expect(translator.toString({one: {$in: 'two'}}))
			.toBe('and(one|in|two)');
	});

	it('Simple nin query', function(){
		expect(translator.toString({one: {$nin: 'two'}}))
			.toBe('and(one|nin|two)');
	});

	it('Simple query, two fields', function(){
		expect(translator.toString({one: 'two', two: 'three'}))
			.toBe('and(one|eq|two,two|eq|three)');
	});

	it('Logical and query, two fields', function(){
		expect(translator.toString({$and: [{one: 'two'}, {two: 'three'}]}))
			.toBe('and(one|eq|two,two|eq|three)');
	});

	it('Logical or query, two fields', function(){
		expect(translator.toString({$or: [{one: 'two'}, {two: 'three'}]}))
			.toBe('or(one|eq|two,two|eq|three)');
	});

	it('Logical not query, two fields', function(){
		expect(translator.toString({$not: [{one: 'two'}, {two: 'three'}]}))
			.toBe('not(one|eq|two,two|eq|three)');
	});

	it('Logical nor query, two fields', function(){
		expect(translator.toString({$nor: [{one: 'two'}, {two: 'three'}]}))
			.toBe('nor(one|eq|two,two|eq|three)');
	});

	it('Logical notdefinedoperator query, two fields', function(){
		expect(translator.toString({$notdefinedoperator: [{one: 'two'}, {two: 'three'}]}))
			.toBe('');
	});

	it('Nested logical query', function(){
		expect(translator.toString({$or: [{one: 'two'}, {$and:[{one: 'two'}, {one: 'three'}]}, {two: 'three'}]}))
			.toBe('or(one|eq|two,and(one|eq|two,one|eq|three),two|eq|three)');
	});
});

