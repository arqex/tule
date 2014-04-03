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
		defaultTypeOptions: {
			label: '',
			okButton: 'Ok',
			cancelButton: 'Cancel'
		},
		events: {
			'click .field-ok': 'onFieldOk',
			'click .field-cancel': 'onFieldCancel',
			'change .element-form-type': 'onChangeFieldType',
			'click .element-form-advanced-toggle': 'onAdvancedToggle'
		},
		getTemplateData: function(){
			return {
				types: dispatcher.typeNames,
				value: this.model.get('value'),
				label: this.typeOptions.label,
				okButton: this.typeOptions.okButton,
				cancelButton: this.typeOptions.cancelButton,
				cid: this.cid
			};
		},
		render: function(){
			dispatcher.BaseView.prototype.render.call(this);
			this.prepareAdvancedOptions(this.$('.element-form-type').val());
			return this;
		},
		save: function() {
			var value = {
				id: this.$('.field-datatype-select').val(),
				options: this.advanced ? this.advanced.getValue() : {}
			};

			this.model.set('value', value);
		},
		onFieldCancel: function(e) {
			e.preventDefault();

			var cid = $(e.target).closest('form').data('cid');
			if(cid == this.cid)			
				this.trigger('changeMode', 'display');
		},
		onChangeFieldType: function(e){
			e.preventDefault();

			var cid = $(e.target).closest('form').data('cid');
			if(cid == this.cid){
				var type = this.$('.element-form-type').val();
				this.prepareAdvancedOptions(type);
			}
		},
		onAdvancedToggle: function(e){
			e.preventDefault();

			var cid = $(e.target).closest('form').data('cid');
			if(cid == this.cid)
				this.$('.element-form-advanced-options').toggle();			
		},
		prepareAdvancedOptions: function(datatype){
			var options = dispatcher.typeOptionsDefinitions[datatype],
				$advanced = this.$('.element-form-advanced-options')
			;
			if(!options)
				return $advanced.html('Unknown datatype: ' + datatype);
			if(!options.length)
				return $advanced.html('No advanced options available for ' + datatype);

			if(this.advanced)			
				this.advanced.remove();

			var objectOptions = {
				propertyDefinitions: options,
				mandatoryProperties: _.map(options, function(prop){return prop.key;}),
				customProperties: false
			};

			this.advanced = dispatcher.getView('object',  objectOptions, this.model.get('value').options);
			this.advanced.changeMode('edit');
			this.advanced.isCustom = false;

			$advanced.html(this.advanced.render().el);
		}
	});

	dispatcher.registerType({
		id: 'field',
		name: 'Field',
		View: FieldTypeView,
		defaultValue: {id: 'string', options: {}},
		typeOptionsDefinition: [
			{key: 'label', label: 'Label', datatype:{id: 'string'}},
			{key: 'okButton', label: 'Ok button text', datatype:{id: 'string'}},
			{key: 'cancelButton', label: 'Cancel button text', datatype: {id: 'string'}}
		],
		controls: true
	});
});