

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./fieldTypeTpl.html',
	'modules/datatypes/datatypeViews'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews){
	"use strict";

	var FieldTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: _.template($(tplSource).find('#fieldTpl').html()),
		editTpl: _.template($(tplSource).find('#fieldEditTpl').html()),
		defaultModelValue: false,
		defaultTypeOptions: {
			allowAnyType: false
		},
		events: {
			'click .field-ok': 'onFieldOk',
			'click .field-cancel': 'onFieldCancel',
			'change .element-form-type': 'onChangeFieldType',
			'click .js-field-advanced-toggle': 'onAdvancedToggle'
		},
		initialize: function() {
			this.types = this.service.getDefinitions();
			if(this.typeOptions.allowAnyType)
				this.types.any = {id: '', name: 'Any'};
		},

		getTemplateData: function(){
			var value = this.model.get('value');
			return {
				types: this.types,
				value: value,
				label: this.getLabel(value),
				okButton: this.datatype.okButton,
				cancelButton: this.datatype.cancelButton,
				cid: this.cid
			};
		},

		getLabel: function(value) {
			var found = _.find(this.types, function(type){ return type.id == value;});

			return found ? found.name : 'Not defined';
		},
		render: function(){
			DatatypeViews.DataTypeView.prototype.render.call(this);
			this.prepareAdvancedOptions(this.$('.element-form-type').val());
			return this;
		},
		save: function() {
			var value = {
				id: this.$('.field-datatype-select').val(),
				options: this.advanced ? this.advanced.model.get('value') : {}
			};

			this.model.set('value', value);

			return this;
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
			var options = this.types[datatype],
				$advanced = this.$('.element-form-advanced-options')
			;
			if(!options)
				return $advanced.html('Unknown datatype: ' + datatype);
			if(!options.typeOptionsDefinition || !options.typeOptionsDefinition.length)
				return $advanced.html('No advanced options available for ' + datatype);

			options = options.typeOptionsDefinition;

			if(this.advanced)
				this.advanced.remove();

			var objectOptions = {
				propertyDefinitions: options,
				mandatoryProperties: _.map(options, function(prop){return prop.key;}),
				customProperties: false
			};

			this.advanced = this.service.get({
				datatype: {id: 'object', options: objectOptions},
				value: this.model.get('value'),
				viewOptions: {closeable: false}
			}); //dispatcher.getView('object',  objectOptions, this.model.get('value').options);

			this.advanced.state('mode', 'edit');

			$advanced.html(this.advanced.render().el);
		}
	});

	return {
		id: 'field',
		name: 'Field',
		View: FieldTypeView,
		defaultValue: FieldTypeView.prototype.defaultModelValue,
		typeOptionsDefinition: [
			{key: 'allowAnyType', label: 'Allow any type', datatype:{id: 'boolean'}}
		],
		controls: true
	};
});