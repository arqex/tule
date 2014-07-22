var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./integerTypeTpl.html',
	'modules/datatypes/datatypeViews'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews){
	"use strict";

	var templates = DatatypeViews.DataTypeView.prototype.extractTemplates(tplSource);

	var IntegerTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: templates.integerTpl,
		editTpl: templates.integerEditTpl,

		defaultModelValue: 0,

		save: function(){
			var value = parseInt(this.$('input').val(), 10);
			this.model.set('value', value);
			this.trigger('edit:ok', value);
		}
	});

	return {
		id: 'integer',
		name: 'Integer',
		defaultValue: IntegerTypeView.prototype.defaultModelValue,
		View: IntegerTypeView
	};

});