"use strict";

define(['jquery', 'underscore', 'backbone', 'modules/core/dispenser'], function($, _, Backbone, Dispenser){

	var createQuery = function(type, query){
		var collection = Dispenser.getCollection(type),
			conditions = {}
		;

		if(query.clause){
			var clauses = [];
			if(_.isString(query.clause))
				clauses.push(query.clause);
			else
				clauses = query.clause;
			conditions['clause'] = clauses;
		}

		if(query.limit != null && query.skip != null){
			conditions['limit'] = query.limit;
			conditions['skip'] = query.skip;
		}				

		return conditions;
	};

	var getURLParam = function (name) {
		var clauses = [],
			parts = (document.location.toString().split('?')[1]).split('&')
		;

		for(var i = 0; i < parts.length; i++)
			if(parts[i] != "")
				clauses.push(decodeURI(parts[i].split('=')[1]));

		return clauses;
	};

	return {
		createQuery: createQuery,
		getURLParam: getURLParam
	};
});