"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./stringTypeTpl.html',
	'modules/datatypes/datatypeViews'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews){

	var StringTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: _.template($(tplSource).find('#stringTpl').html()),
		editTpl: _.template($(tplSource).find('#stringEditTpl').html())
	});

	return {
		id: 'string',
		name: 'String',
		defaultValue: '',
		View: StringTypeView
	};

});