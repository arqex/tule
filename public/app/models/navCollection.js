define(['jquery', 'underscore', 'backbone', 'models/navItem'], function($,_,Backbone, NavItem){
	return Backbone.Collection.extend({
		model: NavItem
	});
});