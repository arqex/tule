"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./fieldTypeTpl.html',
	'modules/datatypes/dispatcher'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){
	var FieldTypeView = dispatcher.BaseView.extend({
		tpl: _.template($(tplSource).find('#fieldTpl').html()),
		editTpl: _.template($(tplSource).find('#fieldEditTpl').html()),
		defaultOptions: {
			selectOptions: [{novalue: 'No select options'}]
		},
		events: {
			'click .field-ok': 'onFieldOk',
			'click .field-cancel': 'onFieldCancel'
		},
		getTemplateData: function(){
			return {
				types: dispatcher.typeNames,
				value: this.model.get('value')
			};
		},
		onFieldOk: function(e) {
			e.preventDefault();
			this.model.set('value', this.$('.field-datatype-select').val());
			this.trigger('changeMode', 'display');
		},
		onFieldCancel: function(e) {
			e.preventDefault();
			this.trigger('changeMode', 'display');
		}
	});

	dispatcher.registerType({
		id: 'field',
		name: 'Field',
		View: FieldTypeView,
		defaultValue: 'string',
		typeOptions:[]
	});
});