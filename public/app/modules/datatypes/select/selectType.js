"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./selectTypeTpl.html',
	'modules/datatypes/dispatcher'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){
	var SelectTypeView = dispatcher.BaseView.extend({
		tpl: _.template($(tplSource).find('#selectTpl').html()),
		editTpl: _.template($(tplSource).find('#selectEditTpl')),
		defaultOptions: {
			selectOptions: [{novalue: 'No select options'}]
		},
		getTemplateData: function(){
			return {
				options: this.options.selectOptions,
				value: this.model.get('value')
			};
		}
	});

	dispatcher.registerType({
		id: 'select',
		name: 'Select box',
		View: SelectTypeView,
		defaultValue: '',
		typeOptions:[
			{key: 'selectOptions', label: 'Selectbox Options', type: 'object', typeOptions:{propertyType: 'string'}}
		]
	});
});