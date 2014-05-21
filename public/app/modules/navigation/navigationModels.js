define(['jquery', 'underscore', 'backbone'], function($,_,Backbone) {
	
	var NavItem = Backbone.Model.extend({
		defaults: {
			text: false,
			url: false,
			subItems: []
		}
	});

	var NavCollection = Backbone.Collection.extend({
		model: NavItem,
	});

	return {
		NavItem: NavItem,
		NavCollection: NavCollection
	};
});