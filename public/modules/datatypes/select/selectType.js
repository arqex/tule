var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./selectTypeTpl.html',
	'modules/datatypes/datatypeViews'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews){
	"use strict";

	var templates = DatatypeViews.DataTypeView.prototype.extractTemplates(tplSource);

	var SelectTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: templates.selectTpl,
		editTpl: templates.selectEditTpl,

		defaultModelValue: null,

		defaultTypeOptions: {
			selectOptions: [{value: 'no-value', label: 'No select options'}]
		},

		getTemplateData: function(){
			var templateData = DatatypeViews.DataTypeView.prototype.getTemplateData.call(this);
			templateData.valueLabel = this.getLabel(this.model.get('value'));
			return templateData;
		},

		getLabel: function(value){
			var label = 'None';

			_.each(this.typeOptions.selectOptions, function(option){
				if(option.value == value)
					label = option.label;
			});

			return label;
		},

		getEditValue: function(){
			if(this.state('mode') == 'edit')
				return this.$('select').val();
			return this.model.get('value');
		},

		save: function(){
			var value = this.$('select').val();
			this.model.set('value', value);
			this.trigger('edit:ok', value);
		}
	});

	return {
		id: 'select',
		name: 'Select box',
		View: SelectTypeView,
		defaultValue: SelectTypeView.prototype.defaultModelValue,
		typeOptionsDefinition:[
			{key: 'selectOptions',
			 datatype: {
			 	id: 'array',
			 	options: {
			 		elementsType: {
			 			id:'object',
			 			options: {
								propertyDefinitions: [
									{key: 'value', datatype: {id: 'string'}},
									{key: 'label', datatype: {id: 'string'}},
								],
								mandatoryProperties: ['value', 'label'],
								customProperties: false
							}
			 			}
			 		}
			 	}
			 }
		]
	};
});