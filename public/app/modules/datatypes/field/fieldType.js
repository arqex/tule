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
			'click .field-cancel': 'onFieldCancel',
			'change .element-form-type': 'onChangeFieldType',
			'click .element-form-advanced-toggle': 'onAdvancedToggle'
		},
		getTemplateData: function(){
			return {
				types: dispatcher.typeNames,
				value: this.model.get('value')
			};
		},
		render: function(){
			dispatcher.BaseView.prototype.render.call(this);
			this.prepareAdvancedOptions(this.$('.element-form-type').val());
			return this;
		},
		onFieldOk: function(e) {
			e.preventDefault();
			var value = {
				id: this.$('.field-datatype-select').val(),
				options: this.advanced ? this.advanced.getValue() : {}
			}

			this.model.set('value', value);
			this.trigger('changeMode', 'display');
			this.trigger('saved', value);
		},
		onFieldCancel: function(e) {
			e.preventDefault();
			this.trigger('changeMode', 'display');
		},
		onChangeFieldType: function(e){
			e.preventDefault();
			var type = this.$('.element-form-type').val();
			this.prepareAdvancedOptions(type);
		},
		onAdvancedToggle: function(e){
			e.preventDefault();
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

			this.advanced = dispatcher.getView('object',  objectOptions);
			this.advanced.changeMode('edit');

			$advanced.html(this.advanced.render().el);
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