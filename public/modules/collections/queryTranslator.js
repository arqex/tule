// The translator is used by the client and the server
;(function(){
	'use strict';

	/**
	 * Converts mongo queries to String for URL insert.
	 *
	 * There are two types of String clauses, logical with format:
	 * operator(clause[,clause....])
	 * And simple clauses with the format
	 * field|operator|value
	 *
	 * Logical operators are the same than MongoDB ones, but without the '$' sign:
	 * or, and, not, nor
	 *
	 * Example
	 * or(price|gt|30,price|lt|20) => {$or: [{price: {$gt: 30}, {price: {$lt: 20}}}]}
	 *
	 * Comparison operators are the same than MongoDB ones, without '$', plus the 'eq' operator
	 * to match a value
	 * gt,gte,lt,lte (in,nin are not usable yet)
	 *
	 * Example
	 * name|eq|Josh => {likes: 'Josh'}
	 * goals|gte|3 => {goals: {$gte: 3}}
	 *
	 * @type {Object}
	 */
	var QueryTranslator = {
		op: {
			comparison: {
				'$gt': 'gt',
				'$gte': 'gte',
				'$in': 'in',
				'$nin': 'nin',
				'$lt': 'lt',
				'$lte': 'lte',
				'$ne': 'ne'
			},

			logical: {
				'$or': 'or',
				'$and': 'and',
				'$not': 'not',
				'$nor': 'nor'
			},

			invertedLogical: {
				'or': '$or',
				'and': '$and',
				'not': '$not',
				'nor': '$nor'
			},

			invertedComparison: {
				'gt': '$gt',
				'gte': '$gte',
				'in': '$in',
				'nin': '$nin',
				'lt': '$lt',
				'lte': '$lte',
				'ne': '$ne',
				'eq': 'eq' // Eq is not a MongoDB operator
			},
		},

		/**
		 * Converts a MongoDB query to a String that can be added as a URL
		 * parameter to make queries to the server
		 * @param  {Object} query MongoDB query
		 * @return {String}       String version of the mongo query.
		 */
		toString: function(query){
			// Object check
			if(query !== Object(query))
				return false;

			if(!this.keys(query).length)
				return '';

			var keys = this.keys(query);

			// If the first element is a logical operator, convert the query
			// directly with the logicalString function.
			if(this.op.logical[keys[0]])
				return this.logicalString(keys[0], query[keys[0]]);

			// Otherwise, we have an 'and' query and every property of the query
			// object is a field with a value.
			var clauses = [];

			for (var field in query) {
				var clause = {};
				clause[field] = query[field];
				clauses.push(clause);
			}

			return this.logicalString('$and', clauses);
		},

		/**
		 * Create a string for a Mongo logical operator.
		 * @param  {String} op     MongoDB logical operator. Can be '$and', '$or' or '$nor'
		 * @param  {Array} clauses Array with clause objects {field|operator: value}
		 * @return {String}        A string with the format op(clause|clause|....)
		 */
		logicalString: function(op, clauses) {
			var stringClauses = [],
				me = this,
				clause
			;

			for (var i = 0; i < clauses.length; i++) {
				clause = clauses[i];
				if(clause === Object(clause)){
					var objectClause = me.objectToClause(clause),
						stringClause = me.clause(objectClause.field, objectClause.value)
					;
					if(stringClause)
						stringClauses.push(stringClause);
				}
			};

			if(!stringClauses.length)
				return '';

			return this.op.logical[op] + '(' + stringClauses.join(',') + ')';
		},

		/**
		 * Create a string representing a single clause.
		 * @param  {String} field Field name or logical operator.
		 * @param  {Array|Object|String} value The value for the field or the clauses for a logical operator.
		 * @return {String}       The string representation of the clause. Format field|op|value or a logicalString.
		 */
		clause: function(field, value) {
			if(this.isArray(value)){
				if(!this.op.logical[field])
					return '';

				return this.logicalString(field, value);
			}
			else if(value === Object(value)){
				var objectClause = this.objectToClause(value);
				if(this.op.comparison[objectClause.field])
					return field + '|' + this.op.comparison[objectClause.field] + '|' + encodeURIComponent(objectClause.value);

				return '';
			}

			return field + '|eq|' + encodeURIComponent(value);
		},

		/**
		 * Converts an object with clause data in an object with field and value properties.
		 * @param  {Object} objectClause Object in format {field: value}
		 * @return {Object}              Object with properties field & value
		 */
		objectToClause: function(objectClause) {
			var keys = this.keys(objectClause);

			if(!keys.length)
				return false;

			return {
				field: keys[0],
				value: objectClause[keys[0]]
			};
		},

		/**
		 * Create a MongoDB query from a string.
		 * @param  {String} str The query in a string format for URLs
		 * @return {Object}     A MongoDB query object.
		 */
		toQuery: function(str){
			var tokens = this.tokenize(str),
				clause = this.parseClause(tokens)
			;

			if(clause.remaining.length)
				throw this.getError('Unexpected ' + clause.remaining[0]);

			return clause.query;
		},

		tokenize: function(str) {
			var tokens = [],
				buffer = ''
			;
			for (var i = 0; i < str.length; i++) {
				var current = str[i];

				if(current == '(') {
					if(buffer.length){
						tokens.push({type: 'str', value: buffer});
						buffer = '';
					}
					tokens.push({type: 'logicOpen', value: current});
				}
				else if(current == ')') {
					if(buffer.length){
						tokens.push({type: 'str', value: buffer});
						buffer = '';
					}
					tokens.push({type: 'logicClose', value: current});
				}
				else if(current == ',') {
					if(buffer.length){
						tokens.push({type: 'str', value: buffer});
						buffer = '';
					}
					tokens.push({type: 'clauseSeparator', value: current});
				}
				else if(current == '|') {
					if(buffer.length){
						tokens.push({type: 'str', value: buffer});
						buffer = '';
					}
					tokens.push({type: 'clausePart', value: current});
				}
				else
					buffer += current;
			}

			if(buffer.length)
				tokens.push({type: 'str', value: buffer});
			return tokens;
		},

		parseClause: function(tokens){
			var query = {},
				current = tokens.shift(),
				buffer = ''
			;

			if(current.type != 'str')
				throw this.getError(current);

			buffer = current;
			current = tokens.shift();

			if(!current)
				throw this.getError('Unexpected End');

			if(current.type == 'logicOpen'){
				return this.parseLogicClause(tokens, buffer.value);
			}
			else if(current.type == 'clausePart'){
				return this.parseSimpleClause(tokens, buffer.value);
			}
			else
				throw this.getError('Unexpected ' + current.value);
		},

		parseLogicClause: function(tokens, operator){
			var query = {},
				clauses = [],
				clause
			;

			operator = this.op.invertedLogical[operator];

			if(!operator)
				throw this.getError('Unknown logical operator ' + operator);

			while(tokens.length){
				if(tokens[0].type == 'logicClose'){
					if(!clauses.length)
						throw this.getError("Empty logical clause");

					tokens.shift();
					query[operator] = clauses;
					return {query: query, remaining: tokens};
				}
				else if(tokens[0].type == 'clauseSeparator'){
					if(!clauses.length)
						throw this.getError('Unexpected ","');

					tokens.shift();
				}
				else {
					clause = this.parseClause(tokens);
					tokens = clause.remaining;
					clauses.push(clause.query);
				}
			}

			throw this.getError('Unexpected End');
		},
		parseSimpleClause: function(tokens, field) {
			var query = {},
				subquery = {},
				current, operator, value
			;

			if(tokens.length < 3)
				throw this.getError('Unexpected End');

			current = tokens.shift();
			if(current.type != 'str')
				throw this.getError('Unexpected ' + current.value);

			operator = this.op.invertedComparison[current.value];
			if(!operator)
				throw this.getError('Unkown operator ' + current.value);

			current = tokens.shift();
			if(current.type != 'clausePart')
				throw this.getError('Unexpected ' + current.value);

			current = tokens.shift();
			if(current.type != 'str')
				throw this.getError('Unexpected ' + current.value);

			value = decodeURIComponent(current.value);

			if(operator == 'eq'){
				query[field] = value;
			}
			else {
				subquery[operator] = value;
				query[field] = subquery;
			}

			return {query: query, remaining: tokens};

		},

		getError: function(msg) {
			return "Query parse error: " + msg;
		},

		keys: function(ob){
			if(Object.keys)
				return Object.keys(ob);

			var keys = [],
				has = Object.prototype.hasOwnProperty
			;
			for (var key in obj)
				if (has(obj, key)) keys.push(key);

			return keys;
		},
		isArray: function(arr){
			if(Array.isArray)
				return Array.isArray(arr);

			return Object.prototype.toString.call(arr) === '[object Array]';
		}

	};

	// If in the browser
	if(typeof define != 'undefined')
		define([], function(){
			return QueryTranslator;
		});

	// If in the server
	if(typeof module != 'undefined')
		module.exports = QueryTranslator;
})();
