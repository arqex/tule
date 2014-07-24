var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./booleanTypeTpl.html',
	'modules/datatypes/datatypeViews'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews){
	"use strict";

	var templates = DatatypeViews.DataTypeView.prototype.extractTemplates(tplSource);

	var BooleanTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: templates.booleanEditTpl,
		editTpl: templates.booleanEditTpl,

		defaultModelValue: false,

		events: {
			'click input:checkbox': 'saveBoolean'
		},

		forceMode: 'edit',

		render: function(){
			var me = this,
				tpl = this.editTpl
			;

			this.$el.html(tpl({value: this.model.get('value')}));
		},

		saveBoolean: function(){
			var value = this.$('input:checked').length;

			this.model.set('value', value);
		},

		getValue: function(){
			return this.model.get('value');
		}
	});

	return {
		id: 'bool',
		name: 'Boolean',
		defaultValue: BooleanTypeView.prototype.defaultModelValue,
		View: BooleanTypeView
	};

	return BooleanTypeView;
});