"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./selectTypeTpl.html',
	'modules/datatypes/dispatcher'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){
	var SelectTypeView = dispatcher.BaseView.extend({
		tpl: _.template($(tplSource).find('#selectTpl').html()),
		editTpl: _.template($(tplSource).find('#selectEditTpl').html()),
		defaultOptions: {
			selectOptions: [{value: 'no-value', label: 'No select options'}]
		},
		events: {
			'change select': 'onChangeValue'
		},

		initialize: function(opts){
			this.value = $.isNumeric(opts.model.get('value')) ? opts.model.get('value') : opts.typeOptions['selectOptions'][0].value;
			this.model.set('value', this.value);
			this.options = opts.typeOptions['selectOptions'] || this.defaultOptions.selectOptions;
			this.mode = opts.mode || 'display';			
		},

		getTemplateData: function(){			
			_.each(this.options, function(option){ 
				if(option.value == this.model.get('value')) 
					this.label=option.label
			}, this);

			return {
				options: this.options,
				value: this.label
			};
		},

		onChangeValue: function(e){
			this.model.set('value', $(e.target).val());
		}
	});

	dispatcher.registerType({
		id: 'select',
		name: 'Select box',
		View: SelectTypeView,
		defaultValue: null,
		typeOptions:[
			{key: 'selectOptions', label: 'Selectbox Options', type: 'object', typeOptions:{propertyType: 'string'}}
		],
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
	});
});