"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./passwordTypeTpl.html',
	'modules/datatypes/datatypeViews'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews){

	var StringTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: _.template($(tplSource).find('#passwordTpl').html()),
		editTpl: _.template($(tplSource).find('#passwordEditTpl').html())
	});

	return {
		id: 'password',
		name: 'Password',
		defaultValue: '',
		View: StringTypeView
	};

});