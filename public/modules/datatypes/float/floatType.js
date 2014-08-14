var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./floatTypeTpl.html',
	'modules/datatypes/datatypeViews'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews){
	"use strict";

	var templates = DatatypeViews.DataTypeView.prototype.extractTemplates(tplSource);

	var FloatTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: templates.floatTpl,
		editTpl: templates.floatEditTpl,

		save: function(){
			var value = parseFloat(this.$('input').val());
			this.model.set('value', value);
			this.trigger('edit:ok', value);
		}
	});

	return {
		id: 'float',
		name: 'Decimal',
		defaultValue: 0.0,
		View: FloatTypeView
	};
});