deps = [
	'jquery', 'underscore', 'backbone'
];

define(deps, function($,_,Backbone)){
	return Backbone.Model.extend({
		idAttribute: '_id'
	});
});